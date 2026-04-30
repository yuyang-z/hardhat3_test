// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// NFT接口（只需要转移功能）
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
// 预言机 Chainlink
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

// UUPS升级
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract NFTAuction  is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable{

    // ======================
    // 拍卖数据结构
    // ======================
    struct Auction {
        address seller;     // 卖家
        address nft;        // NFT合约地址
        uint256 tokenId;    // NFT编号

        uint256 endTime;    // 截止时间

        address highestBidder;  // 当前出价最高者
        uint256 highestBid;    // 当前最高价
        uint256 highestBidUsd;    // 当前最高价 美元

        bool ended;            // 是否结束
    }

    // 拍卖ID计数器
    uint256 public auctionId;

    // auctionId => 拍卖信息
    mapping(uint256 => Auction) public auctions;

    // Chainlink 价格源
    AggregatorV3Interface public priceFeed;

    // // 构造函数传入价格合约地址
    // constructor(address _priceFeed) {
    //     priceFeed = AggregatorV3Interface(_priceFeed);
    // }
    // ======================
    // ❗ constructor → 改成 initialize
    // ======================
    function initialize(address _priceFeed) public initializer {
        __Ownable_init(msg.sender);

        priceFeed = AggregatorV3Interface(_priceFeed);
    }

    // ======================
    // UUPS必须函数（升级权限）
    // ======================
    function _authorizeUpgrade(address) internal override onlyOwner {}


    // ======================
    // 事件（用来记录操作）
    // ======================
    event AuctionCreated(uint256 id);
    event BidInUSD(uint256 id, address bidder, uint256 usd);
    event NewBid(uint256 id, address bidder, uint256 amount);
    event AuctionEnded(uint256 id, address winner, uint256 amount);

    // 1.创建拍卖
    function createAuction(
        address nft,        // NFT合约地址
        uint256 tokenId,    // NFT合约地址
        uint256 duration    // 拍卖时间（秒）
    ) external {
        // 把 NFT 转入合约（托管）
        IERC721(nft).transferFrom(msg.sender, address(this), tokenId);

        auctionId++;

        auctions[auctionId] = Auction({
            seller: msg.sender,
            nft: nft,
            tokenId: tokenId,
            endTime: block.timestamp + duration,
            highestBidder: address(0),
            highestBid: 0,
            highestBidUsd: 0,
            ended: false
        });

        // 记录：拍卖创建了，ID是多少
        emit AuctionCreated(auctionId);
    }

    // 2.出价（ETH）
    function bid(uint256 id) external payable {
        Auction storage a = auctions[id];
        // 拍卖未结束
        require(block.timestamp < a.endTime, "Auction ended");
        // 出价人有足够的钱
        require(msg.value > a.highestBid, "Bid too low");


        // 如果有人之前出价 → 退钱
        if (a.highestBidder != address(0)) {
            // payable(a.highestBidder).transfer(a.highestBid);
            (bool success, ) = payable(a.highestBidder).call{value: a.highestBid}("");
            require(success, "Transfer failed");
        }

        // 更新最高价
        a.highestBidder = msg.sender;
        a.highestBidUsd = convertToUSD(msg.value);
        a.highestBid = msg.value;

        emit BidInUSD(id, msg.sender, a.highestBidUsd);
        emit NewBid(id, msg.sender, msg.value);
    }

    // 3.结束拍卖
    function endAuction(uint256 id) external {
        Auction storage a = auctions[id];

        require(block.timestamp >= a.endTime, "Not ended yet");
        require(!a.ended, "Already ended");

        a.ended = true;

        // 1. NFT 转给赢家
        IERC721(a.nft).transferFrom(address(this), a.highestBidder, a.tokenId);

        // 2. 钱转给卖家
        // payable(a.seller).transfer(a.highestBid);
        (bool success, ) = payable(a.seller).call{value:a.highestBid}("");
        require(success, "Transfer failed");

        emit AuctionEnded(id, a.highestBidder, a.highestBid);
    }



    // ETH 转 USD
    function convertToUSD(uint256 ethAmount) public view returns (uint256) {
        uint256 price = getETHPrice();

        // Chainlink price 有 8 位精度
        return (ethAmount * price) / 1e18;
    }
    
    // 获取 ETH/USD 价格
    function getETHPrice() public view returns (uint256) {
        (
            ,
            int price,
            ,
            ,
            
        ) = priceFeed.latestRoundData();

        return uint256(price);
    }
}