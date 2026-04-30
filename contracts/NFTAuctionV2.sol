// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./NFTAuction.sol";

contract NFTAuctionV2 is NFTAuction {

    function getVersion() external pure returns (string memory) {
        return "V2";
    }
}