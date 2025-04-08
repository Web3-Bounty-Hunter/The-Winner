'use client';

/**
 * 合约配置文件
 * 
 * 包含所有智能合约地址和ABI配置
 */

// 注意：这些地址需要根据实际部署环境更新
export const CONTRACT_ADDRESSES = {
  // BattleCoin代币合约地址
  BATTLE_COIN: "0x0000000000000000000000000000000000000000", // 替换为实际部署地址
  
  // 扑克牌活动合约地址
  TOKEN_ACTIVITY: "0x0000000000000000000000000000000000000000", // 替换为实际部署地址
  
  // 代币兑换合约地址
  TOKEN_SWAP: "0x0000000000000000000000000000000000000000" // 替换为实际部署地址
};

// BattleCoin合约ABI
export const BATTLE_COIN_ABI = [
  // 只读函数
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  
  // 写入函数
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function burn(uint256 amount)",
  
  // 仅限管理员的函数
  "function mint(address to, uint256 amount)",
  "function batchMint(address[] calldata users, uint256[] calldata amounts)",
  "function transferOwnership(address newOwner)",
  
  // 事件
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event TokensMinted(address indexed user, uint256 amount)",
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)"
];

// TokenActivity合约ABI
export const TOKEN_ACTIVITY_ABI = [
  // 只读函数
  "function token() view returns (address)",
  "function tables(uint256) view returns (bool active, bool ended, uint256 totalDeposited)",
  "function tableCount() view returns (uint256)",
  "function getDeposit(uint256 tableId, address user) view returns (uint256)",
  "function getTotalDeposited(uint256 tableId) view returns (uint256)",
  
  // 写入函数
  "function deposit(uint256 tableId, uint256 amount)",
  
  // 仅限管理员的函数
  "function createTable()",
  "function endRound(uint256 tableId, address winner)",
  "function startNewRound(uint256 tableId)",
  "function closeTable(uint256 tableId)",
  
  // 事件
  "event TableCreated(uint256 indexed tableId)",
  "event Deposited(uint256 indexed tableId, address indexed user, uint256 amount)",
  "event RoundEnded(uint256 indexed tableId, address indexed winner, uint256 totalAmount)",
  "event NewRoundStarted(uint256 indexed tableId)"
];

// TokenSwap合约ABI
export const TOKEN_SWAP_ABI = [
  // 只读函数
  "function bcToken() view returns (address)",
  "function bcToEduRate() view returns (uint256)",
  "function eduToBcBonus() view returns (uint256)",
  "function feePercentage() view returns (uint256)",
  "function getExpectedEDU(uint256 bcAmount) view returns (uint256)",
  "function getExpectedBC(uint256 eduAmount) view returns (uint256)",
  "function getLiquidityStatus() view returns (uint256 bcAmount, uint256 eduAmount)",
  
  // 写入函数
  "function swapBCforEDU(uint256 bcAmount)",
  "function swapEDUforBC() payable",
  "function addBCLiquidity(uint256 amount)",
  "function addEDULiquidity() payable",
  
  // 仅限管理员的函数
  "function updateRate(uint256 newBcToEduRate)",
  "function updateBonus(uint256 newEduToBcBonus)",
  "function updateFee(uint256 newFeePercentage)",
  "function addEDULiquidityManual(uint256 amount)",
  "function withdrawBC(uint256 amount)",
  "function withdrawEDU(uint256 amount)",
  "function emergencyWithdraw()",
  
  // 事件
  "event BCSwappedForEDU(address indexed user, uint256 bcAmount, uint256 eduAmount)",
  "event EDUSwappedForBC(address indexed user, uint256 eduAmount, uint256 bcAmount)",
  "event RateUpdated(uint256 newBcToEduRate)",
  "event BonusUpdated(uint256 newEduToBcBonus)",
  "event FeeUpdated(uint256 newFeePercentage)",
  "event TokensWithdrawn(address token, uint256 amount)",
  "event NativeWithdrawn(uint256 amount)",
  "event LiquidityAdded(string tokenType, uint256 amount)"
]; 