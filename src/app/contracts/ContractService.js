'use client';

import { ethers } from 'ethers';
import { 
  CONTRACT_ADDRESSES, 
  BATTLE_COIN_ABI, 
  TOKEN_ACTIVITY_ABI, 
  TOKEN_SWAP_ABI 
} from './ContractConfig';

/**
 * 合约服务类
 * 
 * 提供与智能合约交互的方法
 */
class ContractService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.battleCoinContract = null;
    this.tokenActivityContract = null;
    this.tokenSwapContract = null;
    this.isInitialized = false;
    this.chainId = null;
    this.address = null;
  }

  /**
   * 初始化合约服务
   * @returns {Promise<boolean>} 是否初始化成功
   */
  async init() {
    try {
      // 检查环境
      if (typeof window === 'undefined' || !window.ethereum) {
        console.error('MetaMask未安装或不可用');
        return false;
      }

      // 设置provider和signer
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      this.signer = this.provider.getSigner();
      
      // 获取网络信息
      const network = await this.provider.getNetwork();
      this.chainId = network.chainId;
      
      // 获取当前地址
      this.address = await this.signer.getAddress();
      
      // 初始化合约实例
      this.battleCoinContract = new ethers.Contract(
        CONTRACT_ADDRESSES.BATTLE_COIN,
        BATTLE_COIN_ABI,
        this.signer
      );
      
      this.tokenActivityContract = new ethers.Contract(
        CONTRACT_ADDRESSES.TOKEN_ACTIVITY,
        TOKEN_ACTIVITY_ABI,
        this.signer
      );
      
      this.tokenSwapContract = new ethers.Contract(
        CONTRACT_ADDRESSES.TOKEN_SWAP,
        TOKEN_SWAP_ABI,
        this.signer
      );
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('初始化合约服务失败:', error);
      return false;
    }
  }

  /**
   * 请求用户连接MetaMask
   * @returns {Promise<string>} 用户地址
   */
  async connectWallet() {
    try {
      if (!this.provider) {
        this.provider = new ethers.providers.Web3Provider(window.ethereum);
      }
      
      // 请求用户连接
      const accounts = await this.provider.send("eth_requestAccounts", []);
      
      if (accounts.length > 0) {
        this.signer = this.provider.getSigner();
        this.address = accounts[0];
        
        // 重新初始化合约与签名者
        if (!this.isInitialized) {
          await this.init();
        } else {
          // 重新设置合约签名者
          this.battleCoinContract = this.battleCoinContract.connect(this.signer);
          this.tokenActivityContract = this.tokenActivityContract.connect(this.signer);
          this.tokenSwapContract = this.tokenSwapContract.connect(this.signer);
        }
        
        return this.address;
      }
      throw new Error('未获取到钱包地址');
    } catch (error) {
      console.error('连接钱包失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户ETH余额
   * @returns {Promise<string>} 格式化后的ETH余额
   */
  async getEthBalance() {
    try {
      if (!this.isInitialized) {
        throw new Error('合约服务未初始化');
      }
      
      const balance = await this.provider.getBalance(this.address);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('获取ETH余额失败:', error);
      throw error;
    }
  }

  // ========== BattleCoin Token 相关方法 ==========

  /**
   * 获取BattleCoin代币余额
   * @param {string} address 查询地址，默认为当前用户地址
   * @returns {Promise<string>} 格式化后的代币余额
   */
  async getBCBalance(address = null) {
    try {
      if (!this.isInitialized) {
        throw new Error('合约服务未初始化');
      }
      
      const targetAddress = address || this.address;
      const balance = await this.battleCoinContract.balanceOf(targetAddress);
      return ethers.utils.formatUnits(balance, 18); // 假设小数位是18
    } catch (error) {
      console.error('获取BC余额失败:', error);
      throw error;
    }
  }

  /**
   * 转账BattleCoin代币
   * @param {string} to 接收者地址
   * @param {string|number} amount 转账金额
   * @returns {Promise<ethers.providers.TransactionReceipt>} 交易收据
   */
  async transferBC(to, amount) {
    try {
      if (!this.isInitialized) {
        throw new Error('合约服务未初始化');
      }
      
      // 验证地址格式
      if (!ethers.utils.isAddress(to)) {
        throw new Error('无效的接收地址');
      }
      
      // 转换金额为wei
      const amountInWei = ethers.utils.parseUnits(amount.toString(), 18);
      
      // 发送交易
      const tx = await this.battleCoinContract.transfer(to, amountInWei);
      
      // 等待交易被确认
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error('转账BC失败:', error);
      throw error;
    }
  }

  /**
   * 授权BattleCoin代币使用额度
   * @param {string} spender 使用者地址
   * @param {string|number} amount 授权金额
   * @returns {Promise<ethers.providers.TransactionReceipt>} 交易收据
   */
  async approveBC(spender, amount) {
    try {
      if (!this.isInitialized) {
        throw new Error('合约服务未初始化');
      }
      
      // 验证地址格式
      if (!ethers.utils.isAddress(spender)) {
        throw new Error('无效的授权地址');
      }
      
      // 转换金额为wei
      const amountInWei = ethers.utils.parseUnits(amount.toString(), 18);
      
      // 发送授权交易
      const tx = await this.battleCoinContract.approve(spender, amountInWei);
      
      // 等待交易被确认
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error('授权BC失败:', error);
      throw error;
    }
  }

  /**
   * 销毁BattleCoin代币
   * @param {string|number} amount 销毁金额
   * @returns {Promise<ethers.providers.TransactionReceipt>} 交易收据
   */
  async burnBC(amount) {
    try {
      if (!this.isInitialized) {
        throw new Error('合约服务未初始化');
      }
      
      // 转换金额为wei
      const amountInWei = ethers.utils.parseUnits(amount.toString(), 18);
      
      // 发送销毁交易
      const tx = await this.battleCoinContract.burn(amountInWei);
      
      // 等待交易被确认
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error('销毁BC失败:', error);
      throw error;
    }
  }

  // ========== TokenActivity (扑克游戏) 相关方法 ==========

  /**
   * 获取游戏桌数量
   * @returns {Promise<number>} 桌子数量
   */
  async getTableCount() {
    try {
      if (!this.isInitialized) {
        throw new Error('合约服务未初始化');
      }
      
      const count = await this.tokenActivityContract.tableCount();
      return count.toNumber();
    } catch (error) {
      console.error('获取桌子数量失败:', error);
      throw error;
    }
  }

  /**
   * 获取桌子信息
   * @param {number} tableId 桌子ID
   * @returns {Promise<Object>} 桌子信息
   */
  async getTableInfo(tableId) {
    try {
      if (!this.isInitialized) {
        throw new Error('合约服务未初始化');
      }
      
      const tableInfo = await this.tokenActivityContract.tables(tableId);
      return {
        active: tableInfo.active,
        ended: tableInfo.ended,
        totalDeposited: ethers.utils.formatUnits(tableInfo.totalDeposited, 18)
      };
    } catch (error) {
      console.error('获取桌子信息失败:', error);
      throw error;
    }
  }

  /**
   * 在游戏桌上存入代币
   * @param {number} tableId 桌子ID
   * @param {string|number} amount 存入金额
   * @returns {Promise<ethers.providers.TransactionReceipt>} 交易收据
   */
  async depositToTable(tableId, amount) {
    try {
      if (!this.isInitialized) {
        throw new Error('合约服务未初始化');
      }
      
      // 转换金额为wei
      const amountInWei = ethers.utils.parseUnits(amount.toString(), 18);
      
      // 先授权代币
      const tokenAddress = await this.tokenActivityContract.token();
      const approveTx = await this.battleCoinContract.approve(
        CONTRACT_ADDRESSES.TOKEN_ACTIVITY, 
        amountInWei
      );
      await approveTx.wait();
      
      // 存入代币
      const tx = await this.tokenActivityContract.deposit(tableId, amountInWei);
      
      // 等待交易被确认
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error('存入代币失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户在特定桌子的存款
   * @param {number} tableId 桌子ID
   * @param {string} userAddress 用户地址，默认为当前用户
   * @returns {Promise<string>} 格式化后的存款金额
   */
  async getUserDeposit(tableId, userAddress = null) {
    try {
      if (!this.isInitialized) {
        throw new Error('合约服务未初始化');
      }
      
      const targetAddress = userAddress || this.address;
      const deposit = await this.tokenActivityContract.getDeposit(tableId, targetAddress);
      return ethers.utils.formatUnits(deposit, 18);
    } catch (error) {
      console.error('获取用户存款失败:', error);
      throw error;
    }
  }

  // ========== TokenSwap (代币兑换) 相关方法 ==========

  /**
   * 获取代币兑换信息
   * @returns {Promise<Object>} 兑换信息
   */
  async getSwapInfo() {
    try {
      if (!this.isInitialized) {
        throw new Error('合约服务未初始化');
      }
      
      const bcToEduRate = await this.tokenSwapContract.bcToEduRate();
      const eduToBcBonus = await this.tokenSwapContract.eduToBcBonus();
      const feePercentage = await this.tokenSwapContract.feePercentage();
      const liquidityStatus = await this.tokenSwapContract.getLiquidityStatus();
      
      return {
        bcToEduRate: bcToEduRate.toString(),
        eduToBcBonus: eduToBcBonus.toString(),
        feePercentage: feePercentage.toString(),
        bcLiquidity: ethers.utils.formatUnits(liquidityStatus.bcAmount, 18),
        eduLiquidity: ethers.utils.formatEther(liquidityStatus.eduAmount)
      };
    } catch (error) {
      console.error('获取兑换信息失败:', error);
      throw error;
    }
  }

  /**
   * 计算BC兑换预期获得的EDU
   * @param {string|number} bcAmount BC金额
   * @returns {Promise<string>} 预期获得的EDU金额
   */
  async calculateBCtoEDU(bcAmount) {
    try {
      if (!this.isInitialized) {
        throw new Error('合约服务未初始化');
      }
      
      const amountInWei = ethers.utils.parseUnits(bcAmount.toString(), 18);
      const expectedEDU = await this.tokenSwapContract.getExpectedEDU(amountInWei);
      return ethers.utils.formatEther(expectedEDU);
    } catch (error) {
      console.error('计算BC兑换EDU失败:', error);
      throw error;
    }
  }

  /**
   * 计算EDU兑换预期获得的BC
   * @param {string|number} eduAmount EDU金额
   * @returns {Promise<string>} 预期获得的BC金额
   */
  async calculateEDUtoBC(eduAmount) {
    try {
      if (!this.isInitialized) {
        throw new Error('合约服务未初始化');
      }
      
      const amountInWei = ethers.utils.parseEther(eduAmount.toString());
      const expectedBC = await this.tokenSwapContract.getExpectedBC(amountInWei);
      return ethers.utils.formatUnits(expectedBC, 18);
    } catch (error) {
      console.error('计算EDU兑换BC失败:', error);
      throw error;
    }
  }

  /**
   * 使用BC兑换EDU
   * @param {string|number} bcAmount BC金额
   * @returns {Promise<ethers.providers.TransactionReceipt>} 交易收据
   */
  async swapBCforEDU(bcAmount) {
    try {
      if (!this.isInitialized) {
        throw new Error('合约服务未初始化');
      }
      
      // 转换金额为wei
      const amountInWei = ethers.utils.parseUnits(bcAmount.toString(), 18);
      
      // 先授权代币
      const approveTx = await this.battleCoinContract.approve(
        CONTRACT_ADDRESSES.TOKEN_SWAP, 
        amountInWei
      );
      await approveTx.wait();
      
      // 执行兑换
      const tx = await this.tokenSwapContract.swapBCforEDU(amountInWei);
      
      // 等待交易被确认
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error('BC兑换EDU失败:', error);
      throw error;
    }
  }

  /**
   * 使用EDU兑换BC
   * @param {string|number} eduAmount EDU金额
   * @returns {Promise<ethers.providers.TransactionReceipt>} 交易收据
   */
  async swapEDUforBC(eduAmount) {
    try {
      if (!this.isInitialized) {
        throw new Error('合约服务未初始化');
      }
      
      // 转换金额为wei
      const amountInWei = ethers.utils.parseEther(eduAmount.toString());
      
      // 执行兑换
      const tx = await this.tokenSwapContract.swapEDUforBC({
        value: amountInWei
      });
      
      // 等待交易被确认
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error('EDU兑换BC失败:', error);
      throw error;
    }
  }

  /**
   * 添加BC流动性
   * @param {string|number} amount BC金额
   * @returns {Promise<ethers.providers.TransactionReceipt>} 交易收据
   */
  async addBCLiquidity(amount) {
    try {
      if (!this.isInitialized) {
        throw new Error('合约服务未初始化');
      }
      
      // 转换金额为wei
      const amountInWei = ethers.utils.parseUnits(amount.toString(), 18);
      
      // 先授权代币
      const approveTx = await this.battleCoinContract.approve(
        CONTRACT_ADDRESSES.TOKEN_SWAP, 
        amountInWei
      );
      await approveTx.wait();
      
      // 添加流动性
      const tx = await this.tokenSwapContract.addBCLiquidity(amountInWei);
      
      // 等待交易被确认
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error('添加BC流动性失败:', error);
      throw error;
    }
  }

  /**
   * 添加EDU流动性
   * @param {string|number} amount EDU金额
   * @returns {Promise<ethers.providers.TransactionReceipt>} 交易收据
   */
  async addEDULiquidity(amount) {
    try {
      if (!this.isInitialized) {
        throw new Error('合约服务未初始化');
      }
      
      // 转换金额为wei
      const amountInWei = ethers.utils.parseEther(amount.toString());
      
      // 添加流动性
      const tx = await this.tokenSwapContract.addEDULiquidity({
        value: amountInWei
      });
      
      // 等待交易被确认
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error('添加EDU流动性失败:', error);
      throw error;
    }
  }
}

// 创建单例实例
const contractService = new ContractService();

export default contractService; 