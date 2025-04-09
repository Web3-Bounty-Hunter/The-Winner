const hre = require("hardhat");

async function main() {
  console.log("开始部署 TokenActivity (Poker) 合约...");

  // 获取之前部署的 BattleCoin 地址
  // 注意：您需要替换这个地址为实际部署的 BattleCoin 地址
  const BC_TOKEN_ADDRESS = "0xd0D2034d431C41caAcf48d3C84955F13cb171A29";

  // 部署 TokenActivity 合约
  const TokenActivity = await hre.ethers.getContractFactory("TokenActivity");
  const tokenActivity = await TokenActivity.deploy(BC_TOKEN_ADDRESS);

  await tokenActivity.waitForDeployment();
  const tokenActivityAddress = await tokenActivity.getAddress();

  console.log("TokenActivity 已部署到地址:", tokenActivityAddress);
  console.log("使用的 BattleCoin 地址:", BC_TOKEN_ADDRESS);

  // 验证合约
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("等待区块确认后进行验证...");
    await tokenActivity.deploymentTransaction().wait(5);
    
    await hre.run("verify:verify", {
      address: tokenActivityAddress,
      constructorArguments: [BC_TOKEN_ADDRESS],
    });
    console.log("合约验证完成");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 