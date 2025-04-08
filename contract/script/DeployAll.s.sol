// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/BattleCoin.sol";
import "../src/TokenSwap.sol";
import "../src/Poker.sol";

contract DeployAll is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // 设置参数
        uint256 bcToEduRate = 100; // 100 BC = 1 EDU
        uint256 eduToBcBonus = 11000; // 110% 奖励
        uint256 feePercentage = 100; // 1% 手续费
        uint256 initialEduLiquidity = 0.1 ether; // 初始EDU流动性

        console.log("开始部署所有合约...");

        vm.startBroadcast(deployerPrivateKey);

        // 1. 部署BattleCoin
        console.log("\n=== 部署 BattleCoin ===");
        BattleCoin battleCoin = new BattleCoin();
        console.log("BattleCoin 部署成功: %s", address(battleCoin));

        // 2. 部署TokenSwap
        console.log("\n=== 部署 TokenSwap ===");
        TokenSwap tokenSwap = new TokenSwap{value: initialEduLiquidity}(
            address(battleCoin),
            bcToEduRate,
            eduToBcBonus,
            feePercentage
        );
        console.log("TokenSwap 部署成功: %s", address(tokenSwap));

        // 3. 部署TokenActivity (Poker)
        console.log("\n=== 部署 TokenActivity (Poker) ===");
        TokenActivity tokenActivity = new TokenActivity(address(battleCoin));
        console.log("TokenActivity 部署成功: %s", address(tokenActivity));

        // 打印所有合约地址
        console.log("\n=== 部署摘要 ===");
        console.log("BattleCoin: %s", address(battleCoin));
        console.log("TokenSwap: %s", address(tokenSwap));
        console.log("TokenActivity: %s", address(tokenActivity));

        // 4. 初始设置
        console.log("\n=== 初始设置 ===");
        
        // 给TokenSwap合约添加BC流动性
        console.log("给TokenSwap添加BC流动性...");
        uint256 initialBcLiquidity = 1000 ether;
        battleCoin.mint(address(tokenSwap), initialBcLiquidity);
        console.log("已添加 %s BC到TokenSwap", initialBcLiquidity / 1 ether);
        
        // 创建一个游戏桌
        console.log("创建初始游戏桌...");
        tokenActivity.createTable();
        console.log("游戏桌1已创建");

        vm.stopBroadcast();

        console.log("\n所有合约部署和初始设置完成!");
    }
} 