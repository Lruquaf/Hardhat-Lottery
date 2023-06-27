require("@nomicfoundation/hardhat-toolbox")
require("@nomiclabs/hardhat-solhint")
require("hardhat-deploy")
require("@nomiclabs/hardhat-ethers")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("@nomiclabs/hardhat-etherscan")
require("dotenv").config()

/** @type import('hardhat/config').HardhatUserConfig */
const MUMBAI_RPC_URL = process.env.MUMBAI_RPC_URL || "https://polygon-mumbai"
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://sepolia"
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xkey"
const TEST_PRIVATE_KEY = process.env.TEST_PRIVATE_KEY || "0xkey"
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "key"
const SEPOLIA_ETHERSCAN_API_KEY = process.env.SEPOLIA_ETHERSCAN_API_KEY || "key"
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "key"
module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
            blockConfirmations: 1,
        },
        mumbai: {
            chainId: 80001,
            blockConfirmations: 6,
            url: MUMBAI_RPC_URL,
            accounts: [PRIVATE_KEY, TEST_PRIVATE_KEY],
        },
        sepolia: {
            chainId: 11155111,
            blockConfirmations: 6,
            url: SEPOLIA_RPC_URL,
            accounts: [PRIVATE_KEY, TEST_PRIVATE_KEY],
        },
    },
    etherscan: {
        apiKey: {
            polygonMumbai: POLYGONSCAN_API_KEY,
            sepolia: SEPOLIA_ETHERSCAN_API_KEY,
        },
    },
    solidity: "0.8.7",
    namedAccounts: {
        deployer: {
            default: 0,
            mumbai: 0,
        },
        player: {
            default: 1,
            mumbai: 1,
        },
    },
    mocha: {
        timeout: 400000,
    },
}
