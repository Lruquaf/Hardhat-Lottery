const {network, getNamedAccounts, deployments, ethers} = require("hardhat")
const {developmentChains, checkDatas} = require("../../helper-hardhat-config")
const {assert, expect} = require("chai")

!developmentChains.includes(network.name) ? describe.skip :
describe("Lottery", async function () {
    let lottery, vrfCoordinatorV2Mock, priceConverter, randomNumberGenerator, automation
    let deployer
    let interval, entranceFee
    let provider
    const request = checkDatas["request"]
    const pick = checkDatas["pick"]

    beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer
        provider = new ethers.providers.Web3Provider(network.provider)
        await deployments.fixture(["all"])
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
        priceConverter = await ethers.getContract("PriceConverter", deployer)
        randomNumberGenerator = await ethers.getContract("RandomNumberGenerator", deployer)
        lottery = await ethers.getContract("Lottery", deployer)
        automation = await ethers.getContract("Automation", deployer)
        await randomNumberGenerator.setApprovedContract(lottery.address)
        interval = await lottery.getInterval()
        entranceFee = ethers.utils.parseEther("0.05")
    })

    describe("constructor", async function () {
        it("initializes the lottery correctly", async function () {
            // Ideally should be 1 assert per "it"
            const state = await lottery.getState()
            const interval = await lottery.getInterval()
            const PCAddress = await lottery.priceConverter()
            const RNGAddress = await lottery.randomNumberGenerator()
            assert.equal(state, true)
            assert.equal(interval, "30")
            assert.equal(PCAddress, priceConverter.address)
            assert.equal(RNGAddress, randomNumberGenerator.address)
        })
    })
    describe("enter lottery", async function () {
        it("reverts if you don't pay enough ETH", async function () {
            await expect(lottery.enterLottery()).to.be.revertedWithCustomError(
                lottery,
                "Lottery__NotEntranceFee"
            )
        })
        it("records players if they enter", async function () {
            await lottery.enterLottery({value: entranceFee})
            const player = await lottery.getPlayer("0")
            assert.equal(player, deployer)
        })
        it("emits event on enter", async function () {
            await expect(lottery.enterLottery({value: entranceFee})).to.emit(
                lottery,
                "LotteryEntered"
            )
        })
        it("doesn't allow entrance if lottery is closed", async function () {
            const player = (await getNamedAccounts()).player
            const playerConnectedLottery = await ethers.getContract("Lottery", player)
            await lottery.enterLottery({value: entranceFee})
            await playerConnectedLottery.enterLottery({value: entranceFee})
            await network.provider.send("evm_increaseTime", [interval.toNumber() * 10 + 1])
            await network.provider.send("evm_mine", [])
            await automation.performUpkeep(request)
            await expect(lottery.enterLottery({value: entranceFee})).to.be.revertedWithCustomError(
                lottery,
                "Lottery__Closed"
            )
        })
    })
    describe("checkUpkeep", async function () {
        it("returns false when data is 'request' if lottery haven't enough participant", async function () {
            await network.provider.send("evm_increaseTime", [interval.toNumber() * 10 + 1])
            await network.provider.send("evm_mine", [])
            const {upkeepNeeded} = await automation.callStatic.checkUpkeep(request)
            assert(!upkeepNeeded)
        })
        it("returns true when data is 'request' if all conditions are done", async function () {
            const player = (await getNamedAccounts()).player
            const playerConnectedLottery = await ethers.getContract("Lottery", player)
            await lottery.enterLottery({value: entranceFee})
            await playerConnectedLottery.enterLottery({value: entranceFee})
            await network.provider.send("evm_increaseTime", [interval.toNumber() * 10 + 1])
            await network.provider.send("evm_mine", [])
            const {upkeepNeeded} = await automation.callStatic.checkUpkeep(request)
            assert(upkeepNeeded)
        })
        it("returns false when data is 'pick' if there is no random number", async function () {
            const player = (await getNamedAccounts()).player
            const playerConnectedLottery = await ethers.getContract("Lottery", player)
            await lottery.enterLottery({value: entranceFee})
            await playerConnectedLottery.enterLottery({value: entranceFee})
            await network.provider.send("evm_increaseTime", [interval.toNumber() * 10 + 1])
            await network.provider.send("evm_mine", [])
            await automation.performUpkeep(request)
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.send("evm_mine", [])
            const {upkeepNeeded} = await automation.callStatic.checkUpkeep(pick)
            assert(!upkeepNeeded)
        })
        it("returns true when data is 'pick' if all conditions are done", async function () {
            const player = (await getNamedAccounts()).player
            const playerConnectedLottery = await ethers.getContract("Lottery", player)
            await lottery.enterLottery({value: entranceFee})
            await playerConnectedLottery.enterLottery({value: entranceFee})
            await network.provider.send("evm_increaseTime", [interval.toNumber() * 10 + 1])
            await network.provider.send("evm_mine", [])
            const requestTxResponse = await automation.performUpkeep(request)
            const requestTxReceipt = await requestTxResponse.wait(1)
            const requestId = requestTxReceipt.events[1]
            console.log(requestId)
            const event = requestTxReceipt.logs[1]
            await vrfCoordinatorV2Mock.fulfillRandomWords(event.data, randomNumberGenerator.address)
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.send("evm_mine", [])
            const {upkeepNeeded} = await automation.callStatic.checkUpkeep(pick)
            assert(upkeepNeeded)
        })
    })
    describe("performUpkeep", async function () {
        it("reverts when data is 'request' if enough time did not pass", async function () {
            await expect(automation.performUpkeep(request)).to.be.revertedWithCustomError(
                automation,
                "Automation__PerformUpkeepFailed"
            )
        })
        it("reverts when data is 'request' if lottery have not enough participant", async function () {
            await network.provider.send("evm_increaseTime", [interval.toNumber() * 10 + 1])
            await network.provider.send("evm_mine", [])
            await expect(automation.performUpkeep(request)).to.be.revertedWithCustomError(
                automation,
                "Automation__PerformUpkeepFailed"
            )
        })
        it("reverts when data is 'request' if lottery state is closed", async function () {
            const player = (await getNamedAccounts()).player
            const playerConnectedLottery = await ethers.getContract("Lottery", player)
            await lottery.enterLottery({value: entranceFee})
            await playerConnectedLottery.enterLottery({value: entranceFee})
            await network.provider.send("evm_increaseTime", [interval.toNumber() * 10 + 1])
            await network.provider.send("evm_mine", [])
            await automation.performUpkeep(request)
            await expect(automation.performUpkeep(request)).to.be.revertedWithCustomError(
                automation,
                "Automation__PerformUpkeepFailed"
            )
        })
        it("performs upkeep when data is 'request' if all conditions are done", async function () {
            const player = (await getNamedAccounts()).player
            const playerConnectedLottery = await ethers.getContract("Lottery", player)
            await lottery.enterLottery({value: entranceFee})
            await playerConnectedLottery.enterLottery({value: entranceFee})
            await network.provider.send("evm_increaseTime", [interval.toNumber() * 10 + 1])
            await network.provider.send("evm_mine", [])
            const requestTxResponse = await automation.performUpkeep(request)
            const requestTxReceipt = await requestTxResponse.wait(1)
            const blockNumber = await requestTxResponse.blockNumber
            const latestCheckpoint = (await provider.getBlock(blockNumber)).timestamp
            const requestId = requestTxReceipt.logs[1].data
            assert(!(await lottery.getState()))
            assert.equal((await lottery.getRecentWinner()).toString(), ethers.constants.AddressZero)
            assert.equal(
                (await lottery.getRequestId()).toString(),
                ethers.utils.stripZeros(requestId).toString()
            )
            assert.equal(
                (await lottery.getLatestCheckpoint()).toString(),
                latestCheckpoint.toString()
            )
        })
        it("reverts when data is 'pick' if enough time did not pass", async function () {
            const player = (await getNamedAccounts()).player
            const playerConnectedLottery = await ethers.getContract("Lottery", player)
            await lottery.enterLottery({value: entranceFee})
            await playerConnectedLottery.enterLottery({value: entranceFee})
            await network.provider.send("evm_increaseTime", [interval.toNumber() * 10 + 1])
            await network.provider.send("evm_mine", [])
            const requestTxResponse = await automation.performUpkeep(request)
            const requestTxReceipt = await requestTxResponse.wait(1)
            const event = requestTxReceipt.logs[1]
            await vrfCoordinatorV2Mock.fulfillRandomWords(event.data, randomNumberGenerator.address)
            await expect(automation.performUpkeep(pick)).to.be.revertedWithCustomError(
                automation,
                "Automation__PerformUpkeepFailed"
            )
        })
        it("reverts when data is 'pick' if there is no randomness", async function () {
            const player = (await getNamedAccounts()).player
            const playerConnectedLottery = await ethers.getContract("Lottery", player)
            await lottery.enterLottery({value: entranceFee})
            await playerConnectedLottery.enterLottery({value: entranceFee})
            await network.provider.send("evm_increaseTime", [interval.toNumber() * 10 + 1])
            await network.provider.send("evm_mine", [])
            const requestTxResponse = await automation.performUpkeep(request)
            await requestTxResponse.wait(1)
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.send("evm_mine", [])
            await expect(automation.performUpkeep(pick)).to.be.revertedWithCustomError(
                automation,
                "Automation__PerformUpkeepFailed"
            )
        })
        it("reverts when data is 'pick' if lottery is open", async function () {
            const player = (await getNamedAccounts()).player
            const playerConnectedLottery = await ethers.getContract("Lottery", player)
            await lottery.enterLottery({value: entranceFee})
            await playerConnectedLottery.enterLottery({value: entranceFee})
            await network.provider.send("evm_increaseTime", [interval.toNumber() * 10 + 1])
            await network.provider.send("evm_mine", [])
            let requestTxResponse = await automation.performUpkeep(request)
            let requestTxReceipt = await requestTxResponse.wait(1)
            const event = requestTxReceipt.logs[1]
            // console.log(event.data)
            await vrfCoordinatorV2Mock.fulfillRandomWords(event.data, randomNumberGenerator.address)
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.send("evm_mine", [])
            requestTxResponse = await automation.performUpkeep(pick)
            requestTxReceipt = await requestTxResponse.wait(1)
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.send("evm_mine", [])
            await expect(automation.performUpkeep(pick)).to.be.revertedWithCustomError(
                automation,
                "Automation__PerformUpkeepFailed"
            )
        })
        it("performs upkeep when data is 'pick' if all conditions are done", async function () {
            const player = (await getNamedAccounts()).player
            const playerConnectedLottery = await ethers.getContract("Lottery", player)
            await lottery.enterLottery({value: entranceFee})
            await playerConnectedLottery.enterLottery({value: entranceFee})
            await network.provider.send("evm_increaseTime", [interval.toNumber() * 10 + 1])
            await network.provider.send("evm_mine", [])
            let requestTxResponse = await automation.performUpkeep(request)
            let requestTxReceipt = await requestTxResponse.wait(1)
            const event = requestTxReceipt.logs[1]
            await vrfCoordinatorV2Mock.fulfillRandomWords(event.data, randomNumberGenerator.address)
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.send("evm_mine", [])
            requestTxResponse = await automation.performUpkeep(pick)
            requestTxReceipt = await requestTxResponse.wait(1)
            const blockNumber = await requestTxResponse.blockNumber
            const latestCheckpoint = (await provider.getBlock(blockNumber)).timestamp
            assert.equal((await lottery.getPlayerCounter()).toString(), "0")
            assert(await lottery.getState())
            assert.notEqual(
                (await lottery.getRecentWinner()).toString(),
                ethers.constants.AddressZero
            )
            assert.equal(
                (await lottery.getLatestCheckpoint()).toString(),
                latestCheckpoint.toString()
            )
        })
    })
    describe("end-to-end", async function () {
        beforeEach(async function () {
            const accounts = await ethers.getSigners()
            for (let i = 1; i < 4; i++) {
                const accountConnectedLottery = await lottery.connect(accounts[i])
                await accountConnectedLottery.enterLottery({value: entranceFee})
            }
        })
        it("requests randomness, closes lottery, fulfills randomness", async function () {
            let startingTimestamp = await lottery.getLatestCheckpoint()

            await new Promise(async (resolve, reject) => {
                lottery.once("WinnerRequested", async () => {
                    console.log("WinnerRequested event fired!")
                    try {
                        assert.equal(await lottery.getState(), false)
                        assert.equal((await lottery.getRequestId()).toString(), "1")
                        assert((await lottery.getLatestCheckpoint()) > startingTimestamp)
                        assert.equal((await lottery.getPlayerCounter()).toString(), "3")
                    } catch (e) {
                        reject(e)
                    }
                    resolve()
                })
                await network.provider.send("evm_increaseTime", [interval.toNumber() * 10 + 1])
                await network.provider.send("evm_mine", [])
                const txResponse = await automation.performUpkeep(request)
                await txResponse.wait(1)
            })
        })
        it("picks a winner, resets the lottery, sends the money", async function () {
            const accounts = await ethers.getSigners()
            let startingTimestamp = await lottery.getLatestCheckpoint()
            await new Promise(async (resolve, reject) => {
                lottery.once("WinnerPicked", async () => {
                    console.log("WinnerPicked event fired!")
                    try {
                        const recentWinner = await lottery.getRecentWinner()
                        console.log(recentWinner)
                        console.log(accounts[1].address)
                        console.log(accounts[2].address)
                        console.log(accounts[3].address)
                        const winnerEndingBalance = await accounts[3].getBalance()
                        assert.equal((await lottery.getPlayerCounter()).toString(), "0")
                        assert.equal(await lottery.getState(), true)
                        assert((await lottery.getLatestCheckpoint()) > startingTimestamp)
                        assert.equal(
                            winnerEndingBalance.toString(),
                            winnerStartingBalance.add(entranceFee.mul("3")).toString()
                        )
                    } catch (e) {
                        reject(e)
                    }
                    resolve()
                })
                const winnerStartingBalance = await accounts[3].getBalance()
                await network.provider.send("evm_increaseTime", [interval.toNumber() * 10 + 1])
                await network.provider.send("evm_mine", [])
                let txResponse = await automation.performUpkeep(request)
                const txReceipt = await txResponse.wait(1)
                await vrfCoordinatorV2Mock.fulfillRandomWords(
                    txReceipt.logs[1].data,
                    randomNumberGenerator.address
                )
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                await network.provider.send("evm_mine", [])
                txResponse = await automation.performUpkeep(pick)
                await txResponse.wait(1)
            })
        })
    })
})
