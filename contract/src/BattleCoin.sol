// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BattleCoin is ERC20, Ownable {
    // 事件：记录代币铸造
    event TokensMinted(address indexed user, uint256 amount);

    // 构造函数，设置代币名称和符号
    constructor() ERC20("BattleCoin", "BC") Ownable(msg.sender) {
        // 无初始供应量
    }

    // 公共铸造函数，任何人都可以调用
    function mint(address to, uint256 amount) external {
        require(amount <= 1000 * 10**decimals(), "Exceeds maximum mint amount");
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    // 可选：销毁函数，允许用户销毁代币
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
    // 可选：给多个用户同时铸币
    function batchMint(address[] calldata users, uint256[] calldata amounts) external onlyOwner {
    require(users.length == amounts.length, "Arrays length mismatch");
    for (uint256 i = 0; i < users.length; i++) {
        _mint(users[i], amounts[i]);
        emit TokensMinted(users[i], amounts[i]);
        }
    }

    // 可选：owner转移
    function transferOwnership(address newOwner) public override onlyOwner {
    require(newOwner != address(0), "Invalid address");
    _transferOwnership(newOwner);
    }
}