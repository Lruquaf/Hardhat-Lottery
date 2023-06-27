// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./IPriceConverter.sol";

contract PriceConverter is IPriceConverter {
    AggregatorV3Interface public priceFeed;

    constructor(address _priceFeed) {
        priceFeed = AggregatorV3Interface(_priceFeed);
    }

    function getPrice() public view returns (uint256) {
        (, int256 answer, , , ) = priceFeed.latestRoundData();
        return uint256(answer * 1e10);
    }

    function getConversionRate(uint256 ETHAmount) external view override returns (uint256) {
        uint256 ETHPrice = getPrice();
        uint256 ETHAmountInUsd = (ETHPrice * ETHAmount) / 1e18;
        return ETHAmountInUsd;
    }
}
