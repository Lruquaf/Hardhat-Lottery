const {network, ethers} = require("hardhat")
const {developmentChains, networkConfig} = require("../helper-hardhat-config")
const {verify} = require("../utils/verify")

module.exports = async function ({getNamedAccounts, deployments}) {
    const {deploy, log} = deployments
    const {deployer} = await getNamedAccounts()
    const chainId = network.config.chainId

    let vrfCoordinatorAddress, keyHash, subscriptionId

    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorAddress = vrfCoordinatorV2Mock.address
        const txResponse = await vrfCoordinatorV2Mock.createSubscription()
        const txReceipt = await txResponse.wait(1)
        subscriptionId = txReceipt.events[0].args.subId
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, ethers.utils.parseEther("5"))
        keyHash = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c"
    } else {
        vrfCoordinatorAddress = networkConfig[chainId]["vrfCoordinator"]
        keyHash = networkConfig[chainId]["keyHash"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }

    const args = [vrfCoordinatorAddress, keyHash, subscriptionId]

    const randomNumberGenerator = await deploy("RandomNumberGenerator", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        await vrfCoordinatorV2Mock.addConsumer(subscriptionId, randomNumberGenerator.address)
    }

    if (!developmentChains.includes(network.name) && process.env.POLYGONSCAN_API_KEY) {
        console.log("Verifying...")
        await verify(randomNumberGenerator.address, args)
        console.log("--------------------------------------------------------------")
    }
}

module.exports.tags = ["all", "randomNumberGenerator"]
