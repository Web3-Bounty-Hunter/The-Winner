// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/BattleCoin.sol";

contract BattleCoinTest is Test {
    BattleCoin public battleCoin;
    address owner = address(this);
    address user1 = address(0x1);
    address user2 = address(0x2);

    function setUp() public {
        battleCoin = new BattleCoin();
        vm.label(owner, "Owner");
        vm.label(user1, "User1");
        vm.label(user2, "User2");
    }

    function testName() public {
        assertEq(battleCoin.name(), "BattleCoin");
    }

    function testSymbol() public {
        assertEq(battleCoin.symbol(), "BC");
    }

    function testMintAsOwner() public {
        uint256 amount = 100 ether;
        battleCoin.mint(user1, amount);
        assertEq(battleCoin.balanceOf(user1), amount);
    }

    function testFailMintAsNonOwner() public {
        uint256 amount = 100 ether;
        vm.prank(user1);
        battleCoin.mint(user1, amount);
    }

    function testBurn() public {
        uint256 mintAmount = 100 ether;
        uint256 burnAmount = 30 ether;
        
        battleCoin.mint(user1, mintAmount);
        
        vm.prank(user1);
        battleCoin.burn(burnAmount);
        
        assertEq(battleCoin.balanceOf(user1), mintAmount - burnAmount);
    }

    function testBatchMint() public {
        address[] memory users = new address[](2);
        users[0] = user1;
        users[1] = user2;
        
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 50 ether;
        amounts[1] = 75 ether;
        
        battleCoin.batchMint(users, amounts);
        
        assertEq(battleCoin.balanceOf(user1), amounts[0]);
        assertEq(battleCoin.balanceOf(user2), amounts[1]);
    }

    function testMintEvent() public {
        uint256 amount = 100 ether;
        
        vm.expectEmit(true, true, false, true);
        emit BattleCoin.TokensMinted(user1, amount);
        
        battleCoin.mint(user1, amount);
    }
} 