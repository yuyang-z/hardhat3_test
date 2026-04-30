/// <reference types="mocha" />
import { network } from "hardhat";
import { encodeFunctionData } from "viem";



// 一组测试（测试套件）
describe("NFT Auction",async function () {

    async function deployFixture() {
        
        // 用来操作合约
        const { viem } = await network.create();

        const [owner, user1, user2] = await viem.getWalletClients();

        // 部署 NFT
        const nft = await viem.deployContract("MyNFT");

        // mint NFT 给 owner
        await nft.write.mint([owner.account.address, "ipfs://test"]);

        // 部署 mock
        const mock = await viem.deployContract("MockPriceFeed");

        // ====== 1. 部署 V1 ======
        const auctionV1 = await viem.deployContract("NFTAuction");

        // ====== 2. 部署 Proxy ======
        const proxy = await viem.deployContract("ERC1967Proxy", [
            auctionV1.address,
            encodeFunctionData({
                abi: auctionV1.abi,
                functionName: "initialize",
                args: [mock.address],
            }),
        ]);

        // ====== 3. 用 Proxy 作为 auction ======
        const auction = await viem.getContractAt(
            "NFTAuction",
            proxy.address
        );

        await nft.write.approve([proxy.address, 1n]);

        await nft.write.approve([auction.address, 1n]);

        

        // 授权 NFT 给拍卖合约
        await nft.write.approve([auction.address, 1n]);

        return { viem,owner, user1,user2, nft, auction };
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

    // 出价 + 结束拍卖
    it("bit and print USD", async function () {
        const { viem,owner, user1, user2, nft, auction } = await deployFixture();

        // 先创建拍卖
        await auction.write.createAuction([
            nft.address,
            1n,
            3600n
        ]);


        // user1 出价 1 ETH
        await auction.write.bid([1n], {
            account: user1.account,
            value: 1n * 10n ** 18n
        });

        // 读取拍卖数据
        const a1 = await auction.read.auctions([1n]);

        console.log("user1:最高价 address:", a1[4].toString());
        console.log("user1:最高价 ETH:", a1[5].toString());
        console.log("user1:最高价 USD:", a1[6].toString());

         // user2 出价 2 ETH
        await auction.write.bid([1n], {
            account: user2.account,
            value: 2n * 10n ** 18n
        });

        // 读取拍卖数据
        const a2 = await auction.read.auctions([1n]);

        console.log("user2:最高价 address:", a2[4].toString());
        console.log("user2:最高价 ETH:", a2[5].toString());
        console.log("user2:最高价 USD:", a2[6].toString());


        // 获取链的控制器
        const publicClient = await viem.getPublicClient();

        // 推进时间
        await publicClient.transport.request({
            method: "evm_increaseTime",
            params: [7200],
        });

        // 生成新区块
        await publicClient.transport.request({
            method: "evm_mine",
            params: [],
        });

        // 结束拍卖
        await auction.write.endAuction([1n]);
        // 读取拍卖数据
        const a3 = await auction.read.auctions([1n]);
        console.log("ended:", a3[7]);
    })

})
