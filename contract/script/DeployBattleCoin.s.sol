// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/BattleCoin.sol";

contract DeployBattleCoin is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log(unicode"开始部署 BattleCoin...");
        BattleCoin battleCoin = new BattleCoin();
        console.log(unicode"BattleCoin 部署成功: %s", address(battleCoin));

        vm.stopBroadcast();
    }
} 