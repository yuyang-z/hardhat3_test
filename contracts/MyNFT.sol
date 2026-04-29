// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyNFT is ERC721URIStorage, Ownable {
    // NFT编号，每次 mint +1
    uint256 public tokenId;
    // 构造函数：初始化 NFT 名字 + 符号
    // Ownable(msg.sender) 表示部署者是管理员
    constructor() ERC721("MyNFT", "MNFT") Ownable(msg.sender) {}

    /**
     * mint：铸造 NFT
     * @param to 谁拥有这个 NFT
     * @param uri NFT 图片/metadata地址（IPFS）
     */
    function mint(address to, string memory uri) external onlyOwner {
        // 编号 +1
        tokenId++;
        // 安全铸造 NFT（会检查接收者是否支持NFT）
        _safeMint(to, tokenId);
        // 给 NFT 绑定 metadata（图片/JSON）
        _setTokenURI(tokenId, uri);
    }
}