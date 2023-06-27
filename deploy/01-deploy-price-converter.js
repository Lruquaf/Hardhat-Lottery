const {network} = require("hardhat")
const {developmentChains, networkConfig} = require("../helper-hardhat-config")
const {verify} = require("../utils/verify")

module.exports = async function ({getNamedAccounts, deployments}) {
    const {deploy, log} = deployments
    const {deployer} = await getNamedAccounts()
    const chainId = network.config.chainId

    let ethUsdPriceFeedAddress

    if (developmentChains.includes(network.name)) {
        const mockV3Aggregator = await ethers.getContract("MockV3Aggregator")
        ethUsdPriceFeedAddress = mockV3Aggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdpriceFeed"]
    }

    const args = [ethUsdPriceFeedAddress]

    const priceConverter = await deploy("PriceConverter", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (!developmentChains.includes(network.name) && process.env.POLYGONSCAN_API_KEY) {
        console.log("Verifying...")
        await verify(priceConverter.address, args)
        console.log("--------------------------------------------------------------")
    }
}

module.exports.tags = ["all", "priceConverter"]
