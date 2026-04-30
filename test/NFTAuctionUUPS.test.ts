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

        
        // ====== 1. 部署实现合约 ======
        const implV1 = await viem.deployContract("NFTAuction");

        // ====== 2. encode initialize data ======
        const initData = encodeFunctionData({
            abi: implV1.abi,
            functionName: "initialize",
            args: [mock.address],
        });

        // ====== 3. 部署 Proxy ======
        const proxy = await viem.deployContract("NFTAuctionProxy", [
            implV1.address,
            initData,
        ]);

        // ====== 4. 用 proxy 作为 auction ======
        const auction = await viem.getContractAt(
            "NFTAuction",
            proxy.address
        );


        // 授权 NFT 给拍卖合约
        await nft.write.approve([auction.address, 1n]);

        return { viem,owner, user1,user2, nft, auction, proxy, implV1, mock };
    }



    // 升级到v2
    it("should upgrade from V1 to V2 and preserve state", async function () {
        const { viem,owner, user1, user2, nft, auction, proxy   } = await deployFixture();

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


        // 部署 V2 实现合约
        const implV2 = await viem.deployContract("NFTAuctionV2");

        // 升级到 V2
        await proxy.write.upgradeTo([implV2.address], {
            account: owner.account,
        });

        // 用 V2 ABI 连接 Proxy
        const auctionV2 = await viem.getContractAt(
            "NFTAuctionV2",
            proxy.address
        );


        // 读取拍卖数据
        const a2 = await auction.read.auctions([1n]);

        console.log("user2:最高价 address:", a2[4].toString());
        console.log("user2:最高价 ETH:", a2[5].toString());
        console.log("user2:最高价 USD:", a2[6].toString());
    })
})
