// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MockPriceFeed {
    function latestRoundData()
        external
        pure
        returns (
            uint80,
            int,
            uint,
            uint,
            uint80
        )
    {
        return (0, 3000 * 1e8, 0, 0, 0);
    }
}