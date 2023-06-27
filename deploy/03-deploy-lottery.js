const {network, ethers} = require("hardhat")
const {developmentChains, networkConfig} = require("../helper-hardhat-config")
const {verify} = require("../utils/verify")

module.exports = async function ({getNamedAccounts, deployments}) {
    const {deploy, log} = deployments
    const {deployer} = await getNamedAccounts()

    let entranceFee, interval

    if (developmentChains.includes(network.name)) {
        entranceFee = ethers.utils.parseEther("100")
        interval = "30"
    } else {
        entranceFee = networkConfig[network.config.chainId]["entranceFee"]
        interval = networkConfig[network.config.chainId]["interval"]
    }

    const priceConverter = await ethers.getContract("PriceConverter")
    const randomNumberGenerator = await ethers.getContract("RandomNumberGenerator")

    const args = [entranceFee, interval, randomNumberGenerator.address, priceConverter.address]

    const lottery = await deploy("Lottery", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (!developmentChains.includes(network.name) && process.env.POLYGONSCAN_API_KEY) {
        console.log("Verifying...")
        await verify(lottery.address, args)
        console.log("--------------------------------------------------------------")
    }
    await randomNumberGenerator.setApprovedContract(lottery.address)
}

module.exports.tags = ["all", "lottery"]
