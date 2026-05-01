import { network } from "hardhat";
import { encodeFunctionData } from "viem";

async function main() {
    const { viem } = await network.connect();

    const [deployer] = await viem.getWalletClients();

    console.log("Deploying with:", deployer.account.address);

    // 部署 Mock（价格预言机）
    const mock = await viem.deployContract("MockPriceFeed");
    console.log("Mock deployed:", mock.address);

    // 2️部署 V1 实现合约
    const implV1 = await viem.deployContract("NFTAuction");
    console.log("Impl V1:", implV1.address);

    // 3️encode initialize
    const initData = encodeFunctionData({
        abi: implV1.abi,
        functionName: "initialize",
        args: [mock.address],
    });

    // 4️部署 Proxy
    const proxy = await viem.deployContract("NFTAuctionProxy", [
        implV1.address,
        initData,
    ]);

    console.log("Proxy:", proxy.address);

    // 5️用 Proxy 地址当作最终合约
    console.log("Auction (Proxy):", proxy.address);
}

main().catch(console.error);