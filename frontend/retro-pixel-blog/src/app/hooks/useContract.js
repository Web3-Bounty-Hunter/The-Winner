'use client';

import { useState, useEffect, useCallback } from 'react';
import contractService from '../contracts/ContractService';

// 错误消息的统一管理
const ERROR_MESSAGES = {
  WALLET_NOT_INSTALLED: '请安装MetaMask以继续使用应用',
  WALLET_CONNECTION_REJECTED: '您拒绝了连接钱包的请求，请授权连接以继续使用应用',
  WALLET_NOT_CONNECTED: '请先连接钱包',
  CONTRACT_NOT_INITIALIZED: '合约服务未初始化，请稍后再试',
  GENERIC_ERROR: '操作失败，请稍后再试或联系支持',
};

/**
 * 使用合约功能的自定义Hook
 *
 * 提供合约交互功能，并管理状态
 * @returns {Object} 合约状态和方法
 */
export function useContract() {
  // 状态
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [address, setAddress] = useState('');
  const [ethBalance, setEthBalance] = useState('0');
  const [bcBalance, setBcBalance] = useState('0');
  const [chainId, setChainId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 初始化合约服务
  const initialize = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 检查MetaMask是否安装
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error(ERROR_MESSAGES.WALLET_NOT_INSTALLED);
      }

      // 初始化provider
      const success = await contractService.init();
      if (success) {
        setIsInitialized(true);
      }
    } catch (err) {
      console.error('初始化合约服务失败:', err);
      setError(err.message || ERROR_MESSAGES.GENERIC_ERROR);
      throw err; // 抛出错误以便调用方处理
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 连接钱包
  const connectWallet = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 确保已初始化
      if (!isInitialized) {
        await initialize();
      }

      const walletAddress = await contractService.connectWallet();
      setAddress(walletAddress);
      setIsConnected(true);

      // 获取链ID
      const network = await contractService.provider.getNetwork();
      setChainId(network.chainId.toString());

      // 获取余额
      const ethBal = await contractService.getEthBalance();
      const bcBal = await contractService.getBCBalance();

      setEthBalance(ethBal);
      setBcBalance(bcBal);

      return walletAddress; // 返回地址以便调用方使用
    } catch (err) {
      console.error('连接钱包失败:', err);
      // 区分用户拒绝和其他错误
      if (err.message === '用户拒绝了连接请求') {
        setError(ERROR_MESSAGES.WALLET_CONNECTION_REJECTED);
      } else if (err.message === 'MetaMask未安装') {
        setError(ERROR_MESSAGES.WALLET_NOT_INSTALLED);
      } else {
        setError(err.message || ERROR_MESSAGES.GENERIC_ERROR);
      }
      setIsConnected(false);
      setAddress('');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, initialize]);

  // 刷新余额
  const refreshBalances = useCallback(async () => {
    if (!isConnected || !isInitialized) return;

    try {
      setIsLoading(true);
      setError(null);

      const ethBal = await contractService.getEthBalance();
      const bcBal = await contractService.getBCBalance();

      setEthBalance(ethBal);
      setBcBalance(bcBal);
    } catch (err) {
      console.error('刷新余额失败:', err);
      setError(err.message || '刷新余额失败');
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, isInitialized]);

  // 监听MetaMask事件
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        // 用户断开了连接
        setIsConnected(false);
        setAddress('');
        setEthBalance('0');
        setBcBalance('0');
        setError('钱包已断开连接，请重新连接');
      } else if (accounts[0] !== address) {
        // 用户切换了账户
        setAddress(accounts[0]);
        setIsConnected(true);
        await refreshBalances();
      }
    };

    const handleChainChanged = (newChainId) => {
      setChainId(newChainId);
      // 链变更时重新加载页面（以太坊推荐做法）
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [address, refreshBalances]);

  // 通用错误处理函数
  const handleOperation = useCallback(
    async (operation, successMessage, errorMessage) => {
      if (!isConnected || !isInitialized) {
        throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
      }

      try {
        setIsLoading(true);
        setError(null);

        const result = await operation();
        return result;
      } catch (err) {
        console.error(errorMessage, err);
        setError(err.message || errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, isInitialized]
  );

  // 转账BC代币
  const transferBC = useCallback(
    async (to, amount) => {
      const operation = () => contractService.transferBC(to, amount);
      const result = await handleOperation(
        operation,
        '转账成功',
        '转账BC失败:'
      );
      await refreshBalances();
      return result;
    },
    [handleOperation, refreshBalances]
  );

  // BattleCoin相关功能
  const battleCoin = {
    getBalance: async (address = null) => {
      if (!isInitialized) throw new Error(ERROR_MESSAGES.CONTRACT_NOT_INITIALIZED);
      return contractService.getBCBalance(address);
    },

    transfer: transferBC,

    approve: async (spender, amount) => {
      const operation = () => contractService.approveBC(spender, amount);
      return handleOperation(operation, '授权成功', '授权BC失败:');
    },

    burn: async (amount) => {
      const operation = () => contractService.burnBC(amount);
      const result = await handleOperation(operation, '销毁成功', '销毁BC失败:');
      await refreshBalances();
      return result;
    },
  };

  // 扑克游戏相关功能
  const tokenActivity = {
    getTableCount: async () => {
      if (!isInitialized) throw new Error(ERROR_MESSAGES.CONTRACT_NOT_INITIALIZED);
      return contractService.getTableCount();
    },

    getTableInfo: async (tableId) => {
      if (!isInitialized) throw new Error(ERROR_MESSAGES.CONTRACT_NOT_INITIALIZED);
      return contractService.getTableInfo(tableId);
    },

    deposit: async (tableId, amount) => {
      const operation = () => contractService.depositToTable(tableId, amount);
      const result = await handleOperation(
        operation,
        '存入成功',
        '存入代币失败:'
      );
      await refreshBalances();
      return result;
    },

    getUserDeposit: async (tableId, userAddress = null) => {
      if (!isInitialized) throw new Error(ERROR_MESSAGES.CONTRACT_NOT_INITIALIZED);
      return contractService.getUserDeposit(tableId, userAddress);
    },
  };

  // 代币兑换相关功能
  const tokenSwap = {
    getSwapInfo: async () => {
      if (!isInitialized) throw new Error(ERROR_MESSAGES.CONTRACT_NOT_INITIALIZED);
      return contractService.getSwapInfo();
    },

    calculateBCtoEDU: async (bcAmount) => {
      if (!isInitialized) throw new Error(ERROR_MESSAGES.CONTRACT_NOT_INITIALIZED);
      return contractService.calculateBCtoEDU(bcAmount);
    },

    calculateEDUtoBC: async (eduAmount) => {
      if (!isInitialized) throw new Error(ERROR_MESSAGES.CONTRACT_NOT_INITIALIZED);
      return contractService.calculateEDUtoBC(eduAmount);
    },

    swapBCforEDU: async (bcAmount) => {
      const operation = () => contractService.swapBCforEDU(bcAmount);
      const result = await handleOperation(
        operation,
        '兑换成功',
        'BC兑换EDU失败:'
      );
      await refreshBalances();
      return result;
    },

    swapEDUforBC: async (eduAmount) => {
      const operation = () => contractService.swapEDUforBC(eduAmount);
      const result = await handleOperation(
        operation,
        '兑换成功',
        'EDU兑换BC失败:'
      );
      await refreshBalances();
      return result;
    },

    addBCLiquidity: async (amount) => {
      const operation = () => contractService.addBCLiquidity(amount);
      const result = await handleOperation(
        operation,
        '添加流动性成功',
        '添加BC流动性失败:'
      );
      await refreshBalances();
      return result;
    },

    addEDULiquidity: async (amount) => {
      const operation = () => contractService.addEDULiquidity(amount);
      const result = await handleOperation(
        operation,
        '添加流动性成功',
        '添加EDU流动性失败:'
      );
      await refreshBalances();
      return result;
    },
  };

  return {
    // 状态
    isConnected,
    isInitialized,
    address,
    ethBalance,
    bcBalance,
    chainId,
    isLoading,
    error,

    // 方法
    connectWallet,
    initialize,
    refreshBalances,

    // 合约功能
    battleCoin,
    tokenActivity,
    tokenSwap,

    // 清除错误
    clearError: () => setError(null),
  };
}

export default useContract;