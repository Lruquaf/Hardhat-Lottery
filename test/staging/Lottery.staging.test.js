const {network, getNamedAccounts, ethers} = require("hardhat")
const {developmentChains} = require("../../helper-hardhat-config")
const {assert} = require("chai")

developmentChains.includes(network.name) ? describe.skip :
describe("Lottery", async function () {
    let lottery, priceConverter, randomNumberGenerator, automation
    let deployer
    let interval, entranceFee
    let provider
    let lotteryBalance

    beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer
        provider = new ethers.providers.Web3Provider(network.provider)
        priceConverter = await ethers.getContract("PriceConverter", deployer)
        randomNumberGenerator = await ethers.getContract("RandomNumberGenerator", deployer)
        lottery = await ethers.getContract("Lottery", deployer)
        automation = await ethers.getContract("Automation", deployer)
        interval = await lottery.getInterval()
        entranceFee = ethers.utils.parseEther("0.1")
    })
    describe("end-to-end", async function () {
        it("requests randomness, closes lottery, fulfills randomness", async function () {
            let startingTimestamp = await lottery.getLatestCheckpoint()

            await new Promise(async (resolve, reject) => {
                lottery.once("WinnerRequested", async () => {
                    console.log("WinnerRequested event fired!")
                    try {
                        assert.equal(await lottery.getState(), false)
                        assert.equal(
                            (await lottery.getRequestId()).toString(),
                            (await randomNumberGenerator.requestId()).toString()
                        )
                        assert((await lottery.getLatestCheckpoint()) > startingTimestamp)
                        assert.equal((await lottery.getPlayerCounter()).toString(), "2")
                    } catch (e) {
                        reject(e)
                    }
                    resolve()
                })
                const price = await priceConverter.getPrice()
                const entranceFeeInMatic = ethers.utils.parseEther(
                    (entranceFee / price.toString()).toString()
                )
                console.log(entranceFeeInMatic.toString())
                const {player} = await getNamedAccounts()
                const playerConnectedContract = await ethers.getContract("Lottery", player)
                await lottery.enterLottery({value: entranceFeeInMatic.toString()})
                await playerConnectedContract.enterLottery({value: entranceFeeInMatic.toString()})
            })
        })
        it("picks a winner, resets the lottery, sends the money", async function () {
            let startingTimestamp = await lottery.getLatestCheckpoint()
            const accounts = await ethers.getSigners()
            await new Promise(async (resolve, reject) => {
                lottery.once("WinnerPicked", async () => {
                    console.log("WinnerPicked event fired!")
                    try {
                        const randomNumber = await lottery.getRandomNumber()
                        console.log(randomNumber.toString())
                        const recentWinner = await lottery.getRecentWinner()
                        console.log(recentWinner)
                        let winnerIndex
                        recentWinner == accounts[0].getAddress()
                            ? (winnerIndex = 0)
                            : (winnerIndex = 1)
                        console.log(winnerIndex.toString())
                        const winnerStartingBalance = balances[winnerIndex]
                        const winnerEndingBalance = await accounts[winnerIndex].getBalance()
                        assert.equal((await lottery.getPlayerCounter()).toString(), "0")
                        assert.equal(await lottery.getState(), true)
                        assert((await lottery.getLatestCheckpoint()) > startingTimestamp)
                        assert.equal(
                            winnerEndingBalance.toString(),
                            winnerStartingBalance.add(lotteryBalance).toString()
                        )
                        assert.equal(
                            recentWinner.toString(),
                            await accounts[winnerIndex].getAddress()
                        )
                    } catch (e) {
                        reject(e)
                    }
                    resolve()
                })
                lotteryBalance = await provider.getBalance(lottery.address)
                const player1Balance = await accounts[0].getBalance()
                const player2Balance = await accounts[1].getBalance()
                const balances = [player1Balance, player2Balance]
            })
        })
    })
})
