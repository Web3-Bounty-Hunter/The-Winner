// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenSwap is Ownable {
    // BattleCoin代币合约地址
    IERC20 public bcToken;
    
    // BC:EDU汇率 (表示多少BC兑换1个EDU)
    uint256 public bcToEduRate;
    
    // EDU:BC汇率乘数 (以基点表示，10000 = 100%)
    uint256 public eduToBcBonus;
    
    // 手续费 (以基点表示，100 = 1%)
    uint256 public feePercentage;

    // 事件
    event BCSwappedForEDU(address indexed user, uint256 bcAmount, uint256 eduAmount);
    event EDUSwappedForBC(address indexed user, uint256 eduAmount, uint256 bcAmount);
    event RateUpdated(uint256 newBcToEduRate);
    event BonusUpdated(uint256 newEduToBcBonus);
    event FeeUpdated(uint256 newFeePercentage);
    event TokensWithdrawn(address token, uint256 amount);
    event NativeWithdrawn(uint256 amount);
    event LiquidityAdded(string tokenType, uint256 amount);

    constructor(
        address _bcToken,
        uint256 _bcToEduRate,
        uint256 _eduToBcBonus,
        uint256 _feePercentage
    ) payable Ownable(msg.sender) {
        require(_bcToken != address(0), "BC token address cannot be zero");
        
        bcToken = IERC20(_bcToken);
        bcToEduRate = _bcToEduRate;
        eduToBcBonus = _eduToBcBonus;
        feePercentage = _feePercentage;
    }

    // 使用BC兑换EDU
    function swapBCforEDU(uint256 bcAmount) external {
        require(bcAmount > 0, "Amount must be greater than 0");
        
        uint256 eduAmount = getExpectedEDU(bcAmount);
        require(eduAmount > 0, "EDU amount too small");
        require(address(this).balance >= eduAmount, "Insufficient EDU liquidity");
        
        require(bcToken.transferFrom(msg.sender, address(this), bcAmount), "BC transfer failed");
        
        (bool success, ) = payable(msg.sender).call{value: eduAmount}("");
        require(success, "EDU transfer failed");
        
        emit BCSwappedForEDU(msg.sender, bcAmount, eduAmount);
    }

    // 使用EDU兑换BC
    function swapEDUforBC() external payable {
        uint256 eduAmount = msg.value;
        require(eduAmount > 0, "Amount must be greater than 0");
        
        uint256 bcAmount = getExpectedBC(eduAmount);
        require(bcAmount > 0, "BC amount too small");
        require(bcToken.balanceOf(address(this)) >= bcAmount, "Insufficient BC liquidity");
        
        require(bcToken.transfer(msg.sender, bcAmount), "BC transfer failed");
        
        emit EDUSwappedForBC(msg.sender, eduAmount, bcAmount);
    }

    // 计算BC能兑换的EDU数量
    function getExpectedEDU(uint256 bcAmount) public view returns (uint256) {
        uint256 baseAmount = bcAmount / bcToEduRate;
        uint256 fee = (baseAmount * feePercentage) / 10000;
        return baseAmount - fee;
    }

    // 计算EDU能兑换的BC数量
    function getExpectedBC(uint256 eduAmount) public view returns (uint256) {
        uint256 baseAmount = eduAmount * bcToEduRate;
        baseAmount = (baseAmount * eduToBcBonus) / 10000;
        uint256 fee = (baseAmount * feePercentage) / 10000;
        return baseAmount - fee;
    }

    // 更新兑换汇率（仅限所有者）
    function updateRate(uint256 newBcToEduRate) external onlyOwner {
        require(newBcToEduRate > 0, "Rate must be greater than 0");
        bcToEduRate = newBcToEduRate;
        emit RateUpdated(newBcToEduRate);
    }

    // 更新EDU到BC的奖励系数（仅限所有者）
    function updateBonus(uint256 newEduToBcBonus) external onlyOwner {
        require(newEduToBcBonus >= 10000, "Bonus cannot be less than 100%");
        eduToBcBonus = newEduToBcBonus;
        emit BonusUpdated(newEduToBcBonus);
    }

    // 更新手续费（仅限所有者）
    function updateFee(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= 500, "Fee cannot exceed 5%");
        feePercentage = newFeePercentage;
        emit FeeUpdated(newFeePercentage);
    }

    // 添加BC流动性
    function addBCLiquidity(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(bcToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit LiquidityAdded("BC", amount);
    }

    // 添加EDU流动性
    function addEDULiquidity() external payable {
        require(msg.value > 0, "Amount must be greater than 0");
        emit LiquidityAdded("EDU", msg.value);
    }
    
    // 手动添加EDU流动性记录（仅限所有者）
    function addEDULiquidityManual(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        emit LiquidityAdded("EDU_MANUAL", amount);
    }

    // 提取BC（仅限所有者）
    function withdrawBC(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(bcToken.transfer(msg.sender, amount), "Transfer failed");
        emit TokensWithdrawn(address(bcToken), amount);
    }

    // 提取EDU（仅限所有者）
    function withdrawEDU(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(address(this).balance >= amount, "Insufficient balance");
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        emit NativeWithdrawn(amount);
    }

    // 紧急提款（仅限所有者）
    function emergencyWithdraw() external onlyOwner {
        uint256 bcBalance = bcToken.balanceOf(address(this));
        if (bcBalance > 0) {
            bcToken.transfer(msg.sender, bcBalance);
            emit TokensWithdrawn(address(bcToken), bcBalance);
        }
        
        uint256 eduBalance = address(this).balance;
        if (eduBalance > 0) {
            (bool success, ) = payable(msg.sender).call{value: eduBalance}("");
            require(success, "EDU transfer failed");
            emit NativeWithdrawn(eduBalance);
        }
    }
    
    // 查询流动性状态
    function getLiquidityStatus() external view returns (uint256 bcAmount, uint256 eduAmount) {
        return (bcToken.balanceOf(address(this)), address(this).balance);
    }
    
    // 接收EDU
    receive() external payable {}
    fallback() external payable {}
} 
