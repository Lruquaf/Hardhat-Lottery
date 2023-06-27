const {ethers} = require("hardhat")
const {developmentChains} = require("../helper-hardhat-config")
const {verify} = require("../utils/verify")

module.exports = async function ({getNamedAccounts, deployments}) {
    const {deploy, log} = deployments
    const {deployer} = await getNamedAccounts()

    const lottery = await ethers.getContract("Lottery")
    const args = [lottery.address]

    const automation = await deploy("Automation", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (!developmentChains.includes(network.name) && process.env.POLYGONSCAN_API_KEY) {
        console.log("Verifying...")
        await verify(automation.address, args)
        console.log("--------------------------------------------------------------")
    }
}

module.exports.tags = ["all", "automation"]
