const Utils = require('../../utils')
const ContractClient = require('../contracts/ContractClient')

class StakingProxyClient extends ContractClient {
  constructor (ethWeb3Manager, contractABI, contractRegistryKey, getRegistryAddress, audiusTokenClient) {
    super(ethWeb3Manager, contractABI, contractRegistryKey, getRegistryAddress)
    this.audiusTokenClient = audiusTokenClient
    this.toBN = ethWeb3Manager.getWeb3().utils.toBN
  }

  async token () {
    const method = await this.getMethod('token')
    return method.call()
  }

  async totalStaked () {
    const method = await this.getMethod('totalStaked')
    return this.toBN(await method.call())
  }

  async supportsHistory () {
    const method = await this.getMethod('supportsHistory')
    return method.call()
  }

  async totalStakedFor (account) {
    const method = await this.getMethod('totalStakedFor', account)
    return this.toBN(await method.call())
  }

  async totalStakedForAt (account, blockNumber) {
    const method = await this.getMethod('totalStakedForAt', account, blockNumber)
    return this.toBN(await method.call())
  }

  async isStaker (account) {
    const method = await this.getMethod('isStaker', account)
    return await method.call()
  }
 
  async getDelegateManagerAddress () {
    const method = await this.getMethod('getDelegateManagerAddress')
    return await method.call()
  }
  async getClaimsManagerAddress () {
    const method = await this.getMethod('getClaimsManagerAddress')
    return await method.call()
  }
  async getServiceProviderFactoryAddress () {
    const method = await this.getMethod('getServiceProviderFactoryAddress')
    return await method.call()
  }
  async getGovernanceAddress () {
    const method = await this.getMethod('getGovernanceAddress')
    return await method.call()
  }

  async getLastClaimedBlockForUser () {
    const method = await this.getMethod('lastClaimedFor', this.web3Manager.getWalletAddress())
    let tx = await method.call()
    return tx
  }



  // async getCurrentVersion (serviceType) {
  //   const method = await this.getMethod('getCurrentVersion', Utils.utf8ToHex(serviceType))
  //   let hexVersion = await method.call()
  //   return Utils.hexToUtf8(hexVersion)
  // }

    // async getMinStakeAmount () {
  //   const method = await this.getMethod('getMinStakeAmount')
  //   return this.toBN(await method.call())
  // }

  // async getMaxStakeAmount () {
  //   const method = await this.getMethod('getMaxStakeAmount')
  //   return this.toBN(await method.call())
  // }
  // Does not exist anymore
  // async getClaimInfo () {
  //   const method = await this.getMethod('getClaimInfo')
  //   let tx = await method.call()
  //   return {
  //     txReceipt: tx,
  //     claimableAmount: tx[0] / Math.pow(10, 18),
  //     currentClaimBlock: parseInt(tx[1], 10)
  //   }
  // }

  // async makeClaim () {
  //   const method = await this.getMethod('makeClaim')
  //   let tx = await this.web3Manager.sendTransaction(method, 1000000)
  //   return {
  //     txReceipt: tx
  //   }
  // }

  // async setMinStakeAmount (amountInWei) {
  //   const method = await this.getMethod('setMinStakeAmount', amountInWei)
  //   let tx = await this.web3Manager.sendTransaction(method, 1000000)
  //   return { txReceipt: tx }
  // }

  // async setMaxStakeAmount (amountInWei) {
  //   const method = await this.getMethod('setMaxStakeAmount', amountInWei)
  //   let tx = await this.web3Manager.sendTransaction(method, 1000000)
  //   return { txReceipt: tx }
  // }
}

module.exports = StakingProxyClient
