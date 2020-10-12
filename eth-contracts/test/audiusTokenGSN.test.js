import * as _lib from '../utils/lib.js'

const {
  deployRelayHub,
  runRelayer,
  fundRecipient,
} = require('@openzeppelin/gsn-helpers')

const tokenRegKey = web3.utils.utf8ToHex('TokenGSN')

contract('AudiusTokenGSN', async function (accounts) {
  it.only('test1', async function () {
    // intentionally not using acct0 to make sure no TX accidentally succeeds without specifying sender
    const [, proxyAdminAddress, proxyDeployerAddress] = accounts
    const tokenOwnerAddress = proxyDeployerAddress
    const guardianAddress = proxyDeployerAddress

    const votingPeriod = 10
    const executionDelay = votingPeriod
    const votingQuorumPercent = 10

    const registry = await _lib.deployRegistry(artifacts, proxyAdminAddress, proxyDeployerAddress)
    const governance = await _lib.deployGovernance(
      artifacts,
      proxyAdminAddress,
      proxyDeployerAddress,
      registry,
      votingPeriod,
      executionDelay,
      votingQuorumPercent,
      guardianAddress
    )

    const token = await deployTokenGSN(
      artifacts,
      proxyAdminAddress,
      proxyDeployerAddress,
      tokenOwnerAddress,
      governance.address
    )

    // Register token
    await registry.addContract(tokenRegKey, token.address, { from: proxyDeployerAddress })

    // const web3 = new Web3('http://localhost:8545');

    await deployRelayHub(web3)

    await runRelayer(web3, { quiet: true })

    await fundRecipient(web3, { recipient: token.address, amount: 50000000 })



  })
})
