const hre = require("hardhat");

async function main() {
  console.log("开始部署 TokenSwap 合约...");

  // 获取之前部署的 BattleCoin 地址
  // 注意：您需要替换这个地址为实际部署的 BattleCoin 地址
  const BC_TOKEN_ADDRESS = "0xd0D2034d431C41caAcf48d3C84955F13cb171A29";
  
  // 设置初始参数
  const BC_TO_EDU_RATE = 100; // 示例：100 BC = 1 EDU
  const EDU_TO_BC_BONUS = 10000; // 10000 = 100%，无额外奖励
  const FEE_PERCENTAGE = 100; // 100 = 1% 手续费

  // 部署 TokenSwap 合约
  const TokenSwap = await hre.ethers.getContractFactory("TokenSwap");
  const tokenSwap = await TokenSwap.deploy(
    BC_TOKEN_ADDRESS,
    BC_TO_EDU_RATE,
    EDU_TO_BC_BONUS,
    FEE_PERCENTAGE,
    { value: hre.ethers.parseEther("0.001") } // 部署时添加一些初始 EDU 流动性
  );

  await tokenSwap.waitForDeployment();
  const tokenSwapAddress = await tokenSwap.getAddress();

  console.log("TokenSwap 已部署到地址:", tokenSwapAddress);
  console.log("初始参数：");
  console.log("- BC:EDU 汇率:", BC_TO_EDU_RATE);
  console.log("- EDU:BC 奖励:", EDU_TO_BC_BONUS);
  console.log("- 手续费率:", FEE_PERCENTAGE/100, "%");

  // 验证合约
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("等待区块确认后进行验证...");
    await tokenSwap.deploymentTransaction().wait(5);
    
    await hre.run("verify:verify", {
      address: tokenSwapAddress,
      constructorArguments: [
        BC_TOKEN_ADDRESS,
        BC_TO_EDU_RATE,
        EDU_TO_BC_BONUS,
        FEE_PERCENTAGE
      ],
    });
    console.log("合约验证完成");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 