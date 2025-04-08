// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/BattleCoin.sol";
import "../src/Poker.sol";

contract PokerTest is Test {
    BattleCoin public battleCoin;
    TokenActivity public tokenActivity;
    
    address owner = address(this);
    address user1 = address(0x1);
    address user2 = address(0x2);

    event TableCreated(uint256 indexed tableId);
    event Deposited(uint256 indexed tableId, address indexed user, uint256 amount);
    event RoundEnded(uint256 indexed tableId, address indexed winner, uint256 totalAmount);
    event NewRoundStarted(uint256 indexed tableId);

    function setUp() public {
        // 部署合约
        battleCoin = new BattleCoin();
        tokenActivity = new TokenActivity(address(battleCoin));
        
        // 铸造一些BC给测试用户
        battleCoin.mint(user1, 1000 ether);
        battleCoin.mint(user2, 500 ether);
        
        // 设置标签
        vm.label(owner, "Owner");
        vm.label(user1, "User1");
        vm.label(user2, "User2");
        vm.label(address(battleCoin), "BattleCoin");
        vm.label(address(tokenActivity), "TokenActivity");
    }

    function testInitialState() public {
        assertEq(address(tokenActivity.token()), address(battleCoin));
        assertEq(tokenActivity.tableCount(), 0);
    }

    function testCreateTable() public {
        vm.expectEmit(true, false, false, false);
        emit TableCreated(1);
        tokenActivity.createTable();
        
        assertEq(tokenActivity.tableCount(), 1);
    }

    function testFailCreateTableAsNonOwner() public {
        vm.prank(user1);
        tokenActivity.createTable();
    }

    function testDeposit() public {
        // 先创建一个桌子
        tokenActivity.createTable();
        uint256 tableId = 1;
        uint256 depositAmount = 50 ether;
        
        // 批准合约使用代币
        vm.startPrank(user1);
        battleCoin.approve(address(tokenActivity), depositAmount);
        
        // 执行存款
        vm.expectEmit(true, true, false, true);
        emit Deposited(tableId, user1, depositAmount);
        tokenActivity.deposit(tableId, depositAmount);
        
        vm.stopPrank();
        
        // 验证存款信息
        assertEq(tokenActivity.getDeposit(tableId, user1), depositAmount);
        assertEq(tokenActivity.getTotalDeposited(tableId), depositAmount);
    }

    function testMultipleDeposits() public {
        // 先创建一个桌子
        tokenActivity.createTable();
        uint256 tableId = 1;
        uint256 deposit1 = 50 ether;
        uint256 deposit2 = 30 ether;
        
        // 用户1存款
        vm.startPrank(user1);
        battleCoin.approve(address(tokenActivity), deposit1);
        tokenActivity.deposit(tableId, deposit1);
        vm.stopPrank();
        
        // 用户2存款
        vm.startPrank(user2);
        battleCoin.approve(address(tokenActivity), deposit2);
        tokenActivity.deposit(tableId, deposit2);
        vm.stopPrank();
        
        // 验证存款信息
        assertEq(tokenActivity.getDeposit(tableId, user1), deposit1);
        assertEq(tokenActivity.getDeposit(tableId, user2), deposit2);
        assertEq(tokenActivity.getTotalDeposited(tableId), deposit1 + deposit2);
    }

    function testEndRound() public {
        // 先创建一个桌子
        tokenActivity.createTable();
        uint256 tableId = 1;
        uint256 deposit1 = 50 ether;
        uint256 deposit2 = 30 ether;
        
        // 用户存款
        vm.prank(user1);
        battleCoin.approve(address(tokenActivity), deposit1);
        vm.prank(user1);
        tokenActivity.deposit(tableId, deposit1);
        
        vm.prank(user2);
        battleCoin.approve(address(tokenActivity), deposit2);
        vm.prank(user2);
        tokenActivity.deposit(tableId, deposit2);
        
        uint256 totalDeposited = deposit1 + deposit2;
        uint256 user2BalanceBefore = battleCoin.balanceOf(user2);
        
        // 结束轮次，用户2获胜
        vm.expectEmit(true, true, false, true);
        emit RoundEnded(tableId, user2, totalDeposited);
        tokenActivity.endRound(tableId, user2);
        
        // 验证获胜者获得所有存款
        assertEq(battleCoin.balanceOf(user2), user2BalanceBefore + totalDeposited);
    }

    function testStartNewRound() public {
        // 先创建一个桌子
        tokenActivity.createTable();
        uint256 tableId = 1;
        
        // 用户存款
        vm.prank(user1);
        battleCoin.approve(address(tokenActivity), 50 ether);
        vm.prank(user1);
        tokenActivity.deposit(tableId, 50 ether);
        
        // 结束轮次
        tokenActivity.endRound(tableId, user1);
        
        // 开始新轮次
        vm.expectEmit(true, false, false, false);
        emit NewRoundStarted(tableId);
        tokenActivity.startNewRound(tableId);
        
        // 验证新轮次状态
        assertEq(tokenActivity.getTotalDeposited(tableId), 0);
    }

    function testCloseTable() public {
        // 先创建一个桌子
        tokenActivity.createTable();
        uint256 tableId = 1;
        
        // 用户存款
        vm.prank(user1);
        battleCoin.approve(address(tokenActivity), 50 ether);
        vm.prank(user1);
        tokenActivity.deposit(tableId, 50 ether);
        
        // 结束轮次
        tokenActivity.endRound(tableId, user1);
        
        // 关闭桌子
        tokenActivity.closeTable(tableId);
        
        // 尝试在关闭的桌子上存款（应该失败）
        vm.startPrank(user2);
        battleCoin.approve(address(tokenActivity), 10 ether);
        vm.expectRevert("Table not active");
        tokenActivity.deposit(tableId, 10 ether);
        vm.stopPrank();
    }
} 