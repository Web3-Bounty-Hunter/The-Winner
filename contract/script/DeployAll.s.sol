// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/BattleCoin.sol";
import "../src/TokenSwap.sol";
import "../src/Poker.sol";

contract DeployAll is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Set parameters
        uint256 bcToEduRate = 100; // 100 BC = 1 EDU
        uint256 eduToBcBonus = 11000; // 110% bonus
        uint256 feePercentage = 100; // 1% fee
        uint256 initialEduLiquidity = 0.01 ether; // Initial EDU liquidity

        console.log("...");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy BattleCoin
        console.log("\n=== Deploying BattleCoin ===");
        BattleCoin battleCoin = new BattleCoin();
        console.log("BattleCoin deployed successfully: %s", address(battleCoin));

        // 2. Deploy TokenSwap
        console.log("\n=== Deploying TokenSwap ===");
        TokenSwap tokenSwap = new TokenSwap{value: initialEduLiquidity}(
            address(battleCoin),
            bcToEduRate,
            eduToBcBonus,
            feePercentage
        );
        console.log("TokenSwap deployed successfully: %s", address(tokenSwap));

        // 3. Deploy TokenActivity (Poker)
        console.log("\n=== Deploying TokenActivity (Poker) ===");
        TokenActivity tokenActivity = new TokenActivity(address(battleCoin));
        console.log("TokenActivity deployed successfully: %s", address(tokenActivity));

        // Print all contract addresses
        console.log("\n=== Deployment Summary ===");
        console.log("BattleCoin: %s", address(battleCoin));
        console.log("TokenSwap: %s", address(tokenSwap));
        console.log("TokenActivity: %s", address(tokenActivity));

        // 4. Initial Setup
        console.log("\n=== Initial Setup ===");
        
        // Add BC liquidity to TokenSwap contract
        console.log("Adding BC liquidity to TokenSwap...");
        uint256 initialBcLiquidity = 1000 ether;
        battleCoin.mint(address(tokenSwap), initialBcLiquidity);
        console.log("Added %s BC to TokenSwap", initialBcLiquidity / 1 ether);
        
        // Create a game table
        console.log("Creating initial game table...");
        tokenActivity.createTable();
        console.log("Game table 1 created");

        vm.stopBroadcast();

        console.log("\nAll contracts deployed and initialized successfully!");
    }
} 