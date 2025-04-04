// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/IERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol";

contract TokenActivity is Ownable {
    IERC20 public token; // RewardToken 合约实例
    
    // 桌子的状态
    struct Table {
        bool active; // 桌子是否激活
        bool ended; // 当前轮是否结束
        uint256 totalDeposited; // 本轮总存款
        mapping(address => uint256) deposits; // 每人存款
    }

    // 桌子映射
    mapping(uint256 => Table) public tables;
    uint256 public tableCount; // 桌子总数

    event TableCreated(uint256 indexed tableId);
    event Deposited(uint256 indexed tableId, address indexed user, uint256 amount);
    event RoundEnded(uint256 indexed tableId, address indexed winner, uint256 totalAmount);
    event NewRoundStarted(uint256 indexed tableId);

    constructor(address _token) Ownable(msg.sender) {
        token = IERC20(_token);
    }

    // 创建新桌子
    function createTable() external onlyOwner {
        tableCount++;
        tables[tableCount].active = true;
        emit TableCreated(tableCount);
    }

    // 用户存款到指定桌子
    function deposit(uint256 tableId, uint256 amount) external {
        require(tables[tableId].active, "Table not active");
        require(!tables[tableId].ended, "Current round has ended");
        require(amount > 0, "Amount must be greater than 0");

        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        tables[tableId].deposits[msg.sender] += amount;
        tables[tableId].totalDeposited += amount;

        emit Deposited(tableId, msg.sender, amount);
    }

    // 结束指定桌子的当前轮
    function endRound(uint256 tableId, address winner) external onlyOwner {
        require(tables[tableId].active, "Table not active");
        require(!tables[tableId].ended, "Round already ended");
        require(winner != address(0), "Invalid winner address");
        require(tables[tableId].totalDeposited > 0, "No tokens deposited");

        tables[tableId].ended = true;

        uint256 total = tables[tableId].totalDeposited;
        require(token.transfer(winner, total), "Transfer failed");

        emit RoundEnded(tableId, winner, total);
    }

    // 开始指定桌子的新轮
    function startNewRound(uint256 tableId) external onlyOwner {
        require(tables[tableId].active, "Table not active");
        require(tables[tableId].ended, "Current round not ended");
        
        tables[tableId].ended = false;
        tables[tableId].totalDeposited = 0;
        
        emit NewRoundStarted(tableId);
    }

    // 查询用户在指定桌子的存款
    function getDeposit(uint256 tableId, address user) external view returns (uint256) {
        return tables[tableId].deposits[user];
    }

    // 查询指定桌子的总存款
    function getTotalDeposited(uint256 tableId) external view returns (uint256) {
        return tables[tableId].totalDeposited;
    }

    // 关闭桌子
    function closeTable(uint256 tableId) external onlyOwner {
        require(tables[tableId].active, "Table not active");
        require(tables[tableId].ended, "Current round not ended");
        tables[tableId].active = false;
    }
}