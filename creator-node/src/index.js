'use strict'

const ON_DEATH = require('death')
const ipfsClient = require('ipfs-http-client')
const ipfsClientLatest = require('ipfs-http-client-latest')
const path = require('path')
const AudiusLibs = require('@audius/libs')
const RecurringSync = require('./recurringSync')

const initializeApp = require('./app')
const config = require('./config')
const { sequelize } = require('./models')
const { runMigrations } = require('./migrationManager')
const { logger } = require('./logging')
const BlacklistManager = require('./blacklistManager')

const exitWithError = (...msg) => {
  logger.error(...msg)
  process.exit(1)
}

const initAudiusLibs = async () => {
  const ethWeb3 = await AudiusLibs.Utils.configureWeb3(
    config.get('ethProviderUrl'),
    config.get('ethNetworkId'),
    /* requiresAccount */ false
  )
  const dataWeb3 = await AudiusLibs.Utils.configureWeb3(
    config.get('dataProviderUrl'),
    null,
    false
  )
  const discoveryProviderWhitelist = config.get('discoveryProviderWhitelist')
    ? new Set(config.get('discoveryProviderWhitelist').split(','))
    : null

  const audiusLibs = new AudiusLibs({
    ethWeb3Config: AudiusLibs.configEthWeb3(
      config.get('ethTokenAddress'),
      config.get('ethRegistryAddress'),
      ethWeb3,
      config.get('ethOwnerWallet')
    ),
    web3Config: {
      registryAddress: config.get('dataRegistryAddress'),
      useExternalWeb3: true,
      externalWeb3Config: {
        web3: dataWeb3,
        ownerWallet: config.get('delegateOwnerWallet')
      }
    },
    discoveryProviderConfig: AudiusLibs.configDiscoveryProvider(discoveryProviderWhitelist)
  })
  await audiusLibs.init()
  return audiusLibs
}

const configFileStorage = () => {
  if (!config.get('storagePath')) {
    exitWithError('Must set storagePath to use for content repository.')
  }
  return (path.resolve('./', config.get('storagePath')))
}

const initIPFS = async () => {
  const ipfsAddr = config.get('ipfsHost')
  if (!ipfsAddr) {
    exitWithError('Must set ipfsAddr')
  }
  const ipfs = ipfsClient(ipfsAddr, config.get('ipfsPort'))
  const ipfsLatest = ipfsClientLatest({ host: ipfsAddr, port: config.get('ipfsPort'), protocol: 'http' })

  // initialize ipfs here
  const identity = await ipfs.id()
  // Pretty print the JSON obj with no filter fn (e.g. filter by string or number) and spacing of size 2
  logger.info(`Current IPFS Peer ID: ${JSON.stringify(identity, null, 2)}`)

  // init latest version of ipfs
  const identityLatest = await ipfsLatest.id()
  logger.info(`Current IPFS Peer ID (using latest version of ipfs client): ${JSON.stringify(identityLatest, null, 2)}`)

  return { ipfs, ipfsLatest }
}

const initRecurringSyncs = async () => {
  const recurringSync = new RecurringSync()
  await recurringSync.init()
}

const runDBMigrations = async () => {
  try {
    logger.info('Executing database migrations...')
    await runMigrations()
    logger.info('Migrations completed successfully')
  } catch (err) {
    exitWithError('Error in migrations: ', err)
  }
}

const getMode = () => {
  const arg = process.argv[2]
  const modes = ['--run-migrations', '--run-app', '--run-all']
  if (!modes.includes(arg)) {
    return '--run-all'
  }
  return arg
}

const startApp = async () => {
  logger.info('Configuring service...')

  await config.asyncConfig()

  // fail if delegateOwnerWallet & delegatePrivateKey not present
  const delegateOwnerWallet = config.get('delegateOwnerWallet')
  const delegatePrivateKey = config.get('delegatePrivateKey')
  let spID = config.get('spID')
  console.log(`spID: ${spID} // typeof ${typeof (spID)}`)
  if (!delegateOwnerWallet || !delegatePrivateKey) {
    exitWithError('Cannot startup without delegateOwnerWallet and delegatePrivateKey')
  }

  const storagePath = configFileStorage()

  const { ipfs, ipfsLatest } = await initIPFS()

  const mode = getMode()
  let appInfo

  if (mode === '--run-migrations') {
    await runDBMigrations()
    process.exit(0)
  } else {
    if (mode === '--run-all') {
      await runDBMigrations()
    }

    /** Run app */
    await BlacklistManager.blacklist(ipfs)

    const audiusLibs = (config.get('isUserMetadataNode')) ? null : await initAudiusLibs()
    logger.info('Initialized audius libs')

    /** if spID is 0, check if registered on chain and store locally */
    if (spID === 0 && audiusLibs) {
      console.log(config.get('creatorNodeEndpoint'))
      const recoveredSpID = await audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceProviderIdFromEndpoint(
        config.get('creatorNodeEndpoint')
      )
      config.set('spID', recoveredSpID)
      console.log(`Updated spID: ${recoveredSpID} // typeof ${typeof (recoveredSpID)}`)
    }

    spID = config.get('spID')
    try {
      // console.log(audiusLibs)
      console.log('--')
      let wallet = await audiusLibs.contracts.UserReplicaSetManagerClient.getCreatorNodeWallet(spID) 
      console.log(`UserReplicaSetManager - CnodeWallet for ${spID} - ${wallet}`)
      // This wallet should be equal to the delegate owner wallet config
      let delegateWallet = config.get('delegateOwnerWallet')
      let delegatePrivateKey = config.get('delegatePrivateKey')
      console.log(`From config: delegateWallet=${delegateWallet}, delegatePrivateKey=${delegatePrivateKey}`)
    } catch (e) {
      console.log(`Transient error ${e}`)
    }

    appInfo = initializeApp(config.get('port'), storagePath, ipfs, audiusLibs, BlacklistManager, ipfsLatest)

    // start recurring sync jobs
    await initRecurringSyncs()
  }

  // when app terminates, close down any open DB connections gracefully
  ON_DEATH((signal, error) => {
    // NOTE: log messages emitted here may be swallowed up if using the bunyan CLI (used by
    // default in `npm start` command). To see messages emitted after a kill signal, do not
    // use the bunyan CLI.
    logger.info('Shutting down db and express app...', signal, error)
    sequelize.close()
    if (appInfo) { appInfo.server.close() }
  })
}

startApp()
