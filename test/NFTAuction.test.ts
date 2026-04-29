/// <reference types="mocha" />
import { expect } from "chai";
import { network } from "hardhat";
import hre from "hardhat";
import "@nomicfoundation/hardhat-toolbox-viem";


// 一组测试（测试套件）
describe("NFT Auction",async function () {

    async function deployFixture() {
        
        // 用来操作合约
        const { viem } = await network.create();

        const [owner, user1] = await viem.getWalletClients();

        // 部署 NFT
        const nft = await viem.deployContract("MyNFT");

        // mint NFT 给 owner
        await nft.write.mint([owner.account.address, "ipfs://test"]);

        // 部署拍卖
        const auction = await viem.deployContract("NFTAuction");

        // 授权 NFT 给拍卖合约
        await nft.write.approve([auction.address, 1n]);

        return { owner, user1, nft, auction };
    }

    // 创建拍卖
    it("create NFTAuction",async function(){
        const { owner, nft, auction } = await deployFixture();

        await auction.write.createAuction([
        nft.address,
        1n,
        3600n
        ]);

        const a = await auction.read.auctions([1n]);

    })

})