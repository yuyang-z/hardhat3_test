import assert from "node:assert/strict";

import { network } from "hardhat";
import { getAddress } from "viem";


// 一组测试（测试套件）
describe("MyNFT",async function () {
    // 启动一个“本地区块链”
    // 用来操作合约
    const { viem } = await network.create();
    // 用来“读链上数据”
    const publicClient = await viem.getPublicClient();

    // 单个测试
    it("should mint NFT correctly",async function () {
        // 在本地区块链部署 MyNFT
        const nft = await viem.deployContract("MyNFT");
        // Hardhat 自动给你生成两个账户
        const users = await viem.getWalletClients();
        const user = users[0];
        const uri = "ipfs://test-token-uri";
        // 铸造
        await nft.write.mint([user.account.address, uri]);

        // ===== 检查 owner =====
        const owner = await nft.read.ownerOf([1n]);
        console.log("owner1:", owner);

        assert.equal(getAddress(owner), getAddress(user.account.address));
    })
})