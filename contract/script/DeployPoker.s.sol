// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/Poker.sol";

contract DeployPoker is Script {
    function run() external {
        address bcTokenAddress = vm.envAddress("BC_TOKEN_ADDRESS");
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        console.log("开始部署 TokenActivity (Poker)...");
        console.log("使用 BC Token: %s", bcTokenAddress);

        vm.startBroadcast(deployerPrivateKey);

        TokenActivity tokenActivity = new TokenActivity(bcTokenAddress);
        console.log("TokenActivity 部署成功: %s", address(tokenActivity));

        vm.stopBroadcast();
    }
} 