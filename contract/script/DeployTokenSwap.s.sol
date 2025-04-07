// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/TokenSwap.sol";

contract DeployTokenSwap is Script {
    function run() external {
        address bcTokenAddress = vm.envAddress("BC_TOKEN_ADDRESS");
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // 设置默认参数
        uint256 bcToEduRate = 100; // 100 BC = 1 EDU
        uint256 eduToBcBonus = 11000; // 110% 奖励
        uint256 feePercentage = 100; // 1% 手续费
        uint256 initialLiquidity = 0.1 ether; // 初始EDU流动性

        console.log("开始部署 TokenSwap...");
        console.log("参数:");
        console.log("- BC Token: %s", bcTokenAddress);
        console.log("- BC到EDU汇率: %s", bcToEduRate);
        console.log("- EDU到BC奖励: %s (%.2f%%)", eduToBcBonus, eduToBcBonus / 100.0);
        console.log("- 手续费: %s (%.2f%%)", feePercentage, feePercentage / 100.0);

        vm.startBroadcast(deployerPrivateKey);

        TokenSwap tokenSwap = new TokenSwap{value: initialLiquidity}(
            bcTokenAddress,
            bcToEduRate, 
            eduToBcBonus,
            feePercentage
        );
        
        console.log("TokenSwap 部署成功: %s", address(tokenSwap));

        vm.stopBroadcast();
    }
} 