// Scripts to deploy the BattleCoin contract
const hre = require("hardhat");

async function main() {
  console.log("Starting BattleCoin deployment...");

  // Get the contract factory
  const BattleCoin = await hre.ethers.getContractFactory("BattleCoin");
  
  // Deploy the contract
  const battleCoin = await BattleCoin.deploy();

  // Wait for deployment to finish
  await battleCoin.waitForDeployment();

  // Get the contract address
  const battleCoinAddress = await battleCoin.getAddress();
  
  console.log(`BattleCoin deployed to: ${battleCoinAddress}`);

  // Optional: Verify the contract on Etherscan if on mainnet or testnet
  if (network.name !== "localhost" && network.name !== "hardhat") {
    console.log("Waiting for block confirmations...");
    
    // Wait for 6 block confirmations
    await battleCoin.deploymentTransaction().wait(6);
    
    // Verify the contract
    console.log("Verifying contract...");
    await hre.run("verify:verify", {
      address: battleCoinAddress,
      constructorArguments: [],
    });
    
    console.log("Contract verified!");
  }
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 