const {network} = require("hardhat")
const {developmentChains} = require("../helper-hardhat-config")

module.exports = async function ({getNamedAccounts, deployments}) {
    const {deploy, log} = deployments
    const {deployer} = await getNamedAccounts()

    const DECIMALS = 8
    const INITIAL_PRICE = 200000000000

    const BASE_FEE = ethers.utils.parseEther("0.25")
    const GAS_PER_LINK = 1e9

    const priceFeedArgs = [DECIMALS, INITIAL_PRICE]
    const vrfCoordinatorArgs = [BASE_FEE, GAS_PER_LINK]

    if (developmentChains.includes(network.name)) {
        console.log("Local network detected! Deploying mocks...")

        await deploy("MockV3Aggregator", {
            from: deployer,
            args: priceFeedArgs,
            log: true,
        })

        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            args: vrfCoordinatorArgs,
            log: true,
        })

        console.log("Mocks deployed!")
        console.log("---------------------------------------------------------------------")
    }
}

module.exports.tags = ["all", "mocks"]
