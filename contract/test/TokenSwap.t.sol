// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/BattleCoin.sol";
import "../src/TokenSwap.sol";

contract TokenSwapTest is Test {
    BattleCoin public battleCoin;
    TokenSwap public tokenSwap;
    
    address owner = address(this);
    address user1 = address(0x1);
    address user2 = address(0x2);
    
    // 合约参数
    uint256 bcToEduRate = 100; // 100 BC = 1 EDU
    uint256 eduToBcBonus = 11000; // 110%
    uint256 feePercentage = 100; // 1%
    uint256 initialLiquidity = 1 ether; // 初始EDU流动性

    event BCSwappedForEDU(address indexed user, uint256 bcAmount, uint256 eduAmount);
    event EDUSwappedForBC(address indexed user, uint256 eduAmount, uint256 bcAmount);
    event LiquidityAdded(string tokenType, uint256 amount);

    function setUp() public {
        // 部署合约
        battleCoin = new BattleCoin();
        
        // 使用deal函数给当前合约添加ETH
        deal(address(this), 10 ether);
        
        tokenSwap = new TokenSwap{value: initialLiquidity}(
            address(battleCoin),
            bcToEduRate,
            eduToBcBonus,
            feePercentage
        );
        
        // 铸造一些BC给测试用户和合约
        battleCoin.mint(user1, 1000 ether);
        battleCoin.mint(user2, 500 ether);
        battleCoin.mint(address(tokenSwap), 10000 ether); // 合约BC流动性
        
        // 设置标签
        vm.label(owner, "Owner");
        vm.label(user1, "User1");
        vm.label(user2, "User2");
        vm.label(address(battleCoin), "BattleCoin");
        vm.label(address(tokenSwap), "TokenSwap");
    }

    function testInitialState() public {
        assertEq(address(tokenSwap.bcToken()), address(battleCoin));
        assertEq(tokenSwap.bcToEduRate(), bcToEduRate);
        assertEq(tokenSwap.eduToBcBonus(), eduToBcBonus);
        assertEq(tokenSwap.feePercentage(), feePercentage);
        
        (uint256 bcLiquidity, uint256 eduLiquidity) = tokenSwap.getLiquidityStatus();
        assertEq(bcLiquidity, 10000 ether); // BC流动性
        assertEq(eduLiquidity, initialLiquidity); // EDU流动性
    }

    function testSwapBCforEDU() public {
        uint256 bcAmount = 100 ether;
        uint256 expectedEduAmount = tokenSwap.getExpectedEDU(bcAmount);
        
        // 用户批准TokenSwap合约使用BC
        vm.startPrank(user1);
        battleCoin.approve(address(tokenSwap), bcAmount);
        
        // 记录交换前余额
        uint256 bcBalanceBefore = battleCoin.balanceOf(user1);
        uint256 eduBalanceBefore = user1.balance;
        
        // 执行交换
        vm.expectEmit(true, false, false, true);
        emit BCSwappedForEDU(user1, bcAmount, expectedEduAmount);
        tokenSwap.swapBCforEDU(bcAmount);
        
        // 交换后余额检查
        assertEq(battleCoin.balanceOf(user1), bcBalanceBefore - bcAmount);
        assertEq(user1.balance, eduBalanceBefore + expectedEduAmount);
        
        vm.stopPrank();
    }

    function testSwapEDUforBC() public {
        uint256 eduAmount = 0.1 ether;
        uint256 expectedBcAmount = tokenSwap.getExpectedBC(eduAmount);
        
        // 给用户一些ETH
        vm.deal(user2, 1 ether);
        
        vm.startPrank(user2);
        
        // 记录交换前余额
        uint256 bcBalanceBefore = battleCoin.balanceOf(user2);
        
        // 执行交换
        vm.expectEmit(true, false, false, true);
        emit EDUSwappedForBC(user2, eduAmount, expectedBcAmount);
        tokenSwap.swapEDUforBC{value: eduAmount}();
        
        // 交换后余额检查
        assertEq(battleCoin.balanceOf(user2), bcBalanceBefore + expectedBcAmount);
        
        vm.stopPrank();
    }

    function testUpdateRate() public {
        uint256 newRate = 150;
        tokenSwap.updateRate(newRate);
        assertEq(tokenSwap.bcToEduRate(), newRate);
    }

    function testUpdateBonus() public {
        uint256 newBonus = 12000; // 120%
        tokenSwap.updateBonus(newBonus);
        assertEq(tokenSwap.eduToBcBonus(), newBonus);
    }

    function testUpdateFee() public {
        uint256 newFee = 150; // 1.5%
        tokenSwap.updateFee(newFee);
        assertEq(tokenSwap.feePercentage(), newFee);
    }

    function testAddBCLiquidity() public {
        uint256 amount = 200 ether;
        
        // 批准和添加流动性
        vm.startPrank(user1);
        battleCoin.approve(address(tokenSwap), amount);
        
        vm.expectEmit(false, false, false, true);
        emit LiquidityAdded("BC", amount);
        tokenSwap.addBCLiquidity(amount);
        
        vm.stopPrank();
        
        // 检查合约余额是否增加
        (uint256 bcLiquidity, ) = tokenSwap.getLiquidityStatus();
        assertEq(bcLiquidity, 10000 ether + 200 ether);
    }

    function testAddEDULiquidity() public {
        uint256 amount = 0.5 ether;
        
        // 给用户一些ETH
        vm.deal(user1, 1 ether);
        
        vm.startPrank(user1);
        
        vm.expectEmit(false, false, false, true);
        emit LiquidityAdded("EDU", amount);
        tokenSwap.addEDULiquidity{value: amount}();
        
        vm.stopPrank();
        
        // 检查合约余额是否增加
        (, uint256 eduLiquidity) = tokenSwap.getLiquidityStatus();
        assertEq(eduLiquidity, initialLiquidity + amount);
    }

    function testEmergencyWithdraw() public {
        // 记录所有者的初始余额
        uint256 ownerBcBefore = battleCoin.balanceOf(owner);
        uint256 ownerEduBefore = owner.balance;
        
        // 获取合约中的流动性
        (uint256 bcLiquidity, uint256 eduLiquidity) = tokenSwap.getLiquidityStatus();
        
        // 执行紧急提款
        tokenSwap.emergencyWithdraw();
        
        // 检查所有者是否收到了所有资金
        assertEq(battleCoin.balanceOf(owner), ownerBcBefore + bcLiquidity);
        assertEq(owner.balance, ownerEduBefore + eduLiquidity);
        
        // 检查合约余额是否为0
        (uint256 bcAfter, uint256 eduAfter) = tokenSwap.getLiquidityStatus();
        assertEq(bcAfter, 0);
        assertEq(eduAfter, 0);
    }

    receive() external payable {}
} 