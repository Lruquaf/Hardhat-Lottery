# Lottery
This dApp is a lottery, which has a seperated structure, using Chainlink Price Feeds, VRF and Automation.

## Elements
There are a main lottery contract `Lottery.sol`, MATIC/USD price converter contract using Chainlink Price Feeds `PriceConverter.sol`, random number generator contract using Chainlink VRF `RandomNumberGenerator.sol`, automation of requesting randomness and picking winner processes contract using Chainlink Automation `Automation.sol`.

## Workflow
1. Users can enter the current lottery by paying some MATIC.
2. Lottery entrance fee is determined by Chainlink Price Feeds momentarily.
3. Automation checks lottery deadline and other conditions regularly.
4. When enough time is passed all conditions are done, Automation requests a random winner for current lottery.
5. Contract requests a random number from VRF.
6. Automation checks fulfillment of randomness and other conditions regularly.
7. VRF fulfills the request with random number.
8. When randomness is fulfilled and other conditions are done, Automation picks the random winner for current lottery.
9. Contract sends its whole balance to the lucky winner.

## Links
- Lottery: https://mumbai.polygonscan.com/address/0xd62d0CeD4e33Dc51a150461A38744D74203ad055
- PriceConverter: https://mumbai.polygonscan.com/address/0xFa719161E84EC091b8723856d1c8496bc2545Bf0
- RandomNumberGenerator: https://mumbai.polygonscan.com/address/0xa52a4f532a5f187cc716216876eacdad3a1cc6a9
- Automation: https://mumbai.polygonscan.com/address/0x4b3bd480ceeca66ea2706e32c9cf066a35594a87
- VRF Subscription: https://vrf.chain.link/mumbai/5331
- Automation for Requesting: https://automation.chain.link/mumbai/64369934782591002702989340216198759427603376413886677381742116440627746000768
- Automation for Picking: https://automation.chain.link/mumbai/17124328698604732618102954101847535068371320749721210489066297977634516735918
- **Donations (on EVM, preferably in Stablecoin):** 0x316ef5b0f40db115c4fb4e1e29a4c5fd8b36eec1
