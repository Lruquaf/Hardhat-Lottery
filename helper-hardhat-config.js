const {ethers} = require("hardhat")

const networkConfig = {
    11155111: {
        name: "sepolia",
        ethUsdpriceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
        vrfCoordinator: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
        keyHash: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        subscriptionId: "0",
    },
    80001: {
        name: "mumbai",
        ethUsdpriceFeed: "0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada",
        vrfCoordinator: "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed",
        keyHash: "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f",
        subscriptionId: "5331",
        entranceFee: ethers.utils.parseEther("0.1"),
        interval: "30",
    },
}

const checkDatas = {
    request:
        "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000077265717565737400000000000000000000000000000000000000000000000000",
    pick: "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000047069636b00000000000000000000000000000000000000000000000000000000",
}

const developmentChains = ["hardhat", "localhost"]

module.exports = {networkConfig, developmentChains, checkDatas}
