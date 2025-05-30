// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol";

contract BattleCoin is ERC20, Ownable {
    // 事件：记录代币铸造
    event TokensMinted(address indexed user, uint256 amount);

    // 构造函数，设置代币名称和符号
    constructor() ERC20("BattleCoin", "BC") Ownable(msg.sender) {
        // 无初始供应量
    }

    // 后端铸造函数，仅限拥有者调用
    function mint(address to, uint256 amount) external onlyOwner {
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