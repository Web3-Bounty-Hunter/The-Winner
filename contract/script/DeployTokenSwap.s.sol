// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/TokenSwap.sol";

contract DeployTokenSwap is Script {
    function run() external {
        address bcTokenAddress = vm.envAddress("BC_TOKEN_ADDRESS");
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Default parameters
        uint256 bcToEduRate = 1; // 100 BC = 1 EDU
        uint256 eduToBcBonus = 110; // 110% bonus
        uint256 feePercentage = 100; // 1% fee
        uint256 initialLiquidity = 0.00001 ether; // Initial EDU liquidity

        console.log("Starting TokenSwap deployment...");
        
        vm.startBroadcast(deployerPrivateKey);

        // 部署合约时只使用 value 参数
        TokenSwap tokenSwap = new TokenSwap{value: initialLiquidity}(
            bcTokenAddress,
            bcToEduRate,
            eduToBcBonus,
            feePercentage
        );
        
        console.log("TokenSwap deployed at: %s", address(tokenSwap));
        console.log("TokenSwap initialized with parameters:");
        console.log("- BC Token: %s", bcTokenAddress);
        console.log("- BC to EDU rate: %s", bcToEduRate);
        console.log("- EDU to BC bonus: %s (%.2f%%)", eduToBcBonus, eduToBcBonus / 100.0);
        console.log("- Fee: %s (%.2f%%)", feePercentage, feePercentage / 100.0);

        vm.stopBroadcast();
    }
} 