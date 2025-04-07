'use client';

import { useState, useEffect, useCallback } from 'react';
import contractService from '../contracts/ContractService';

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
      const success = await contractService.init();
      
      if (success) {
        setIsInitialized(true);
        setAddress(contractService.address);
        setChainId(contractService.chainId);
        setIsConnected(true);
        
        // 获取余额
        const ethBal = await contractService.getEthBalance();
        const bcBal = await contractService.getBCBalance();
        
        setEthBalance(ethBal);
        setBcBalance(bcBal);
      }
    } catch (err) {
      console.error('初始化合约服务失败:', err);
      setError(err.message || '初始化失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 连接钱包
  const connectWallet = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const walletAddress = await contractService.connectWallet();
      setAddress(walletAddress);
      setIsConnected(true);
      
      if (!isInitialized) {
        await initialize();
      } else {
        // 刷新余额
        const ethBal = await contractService.getEthBalance();
        const bcBal = await contractService.getBCBalance();
        
        setEthBalance(ethBal);
        setBcBalance(bcBal);
      }
    } catch (err) {
      console.error('连接钱包失败:', err);
      setError(err.message || '连接失败');
    } finally {
      setIsLoading(false);
    }
  }, [initialize, isInitialized]);

  // 刷新余额
  const refreshBalances = useCallback(async () => {
    if (!isConnected || !isInitialized) return;
    
    try {
      setIsLoading(true);
      const ethBal = await contractService.getEthBalance();
      const bcBal = await contractService.getBCBalance();
      
      setEthBalance(ethBal);
      setBcBalance(bcBal);
    } catch (err) {
      console.error('刷新余额失败:', err);
      // 不设置错误状态，避免中断用户体验
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, isInitialized]);

  // 监听账户变更
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    
    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        // 用户断开了连接
        setIsConnected(false);
        setAddress('');
      } else if (accounts[0] !== address) {
        // 用户切换了账户
        setAddress(accounts[0]);
        refreshBalances();
      }
    };
    
    const handleChainChanged = () => {
      // 链变更时重新加载页面是以太坊推荐的做法
      window.location.reload();
    };
    
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [address, refreshBalances]);

  // 转账BC代币
  const transferBC = useCallback(async (to, amount) => {
    if (!isConnected || !isInitialized) {
      throw new Error('钱包未连接');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const receipt = await contractService.transferBC(to, amount);
      
      // 更新余额
      const bcBal = await contractService.getBCBalance();
      setBcBalance(bcBal);
      
      return receipt;
    } catch (err) {
      console.error('转账BC失败:', err);
      setError(err.message || '转账失败');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, isInitialized]);

  // BattleCoin相关功能
  const battleCoin = {
    // 获取余额
    getBalance: async (address = null) => {
      if (!isInitialized) throw new Error('合约未初始化');
      return contractService.getBCBalance(address);
    },
    
    // 转账
    transfer: transferBC,
    
    // 授权代币使用
    approve: async (spender, amount) => {
      if (!isConnected || !isInitialized) {
        throw new Error('钱包未连接');
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        const receipt = await contractService.approveBC(spender, amount);
        return receipt;
      } catch (err) {
        console.error('授权BC失败:', err);
        setError(err.message || '授权失败');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    
    // 销毁代币
    burn: async (amount) => {
      if (!isConnected || !isInitialized) {
        throw new Error('钱包未连接');
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        const receipt = await contractService.burnBC(amount);
        
        // 更新余额
        const bcBal = await contractService.getBCBalance();
        setBcBalance(bcBal);
        
        return receipt;
      } catch (err) {
        console.error('销毁BC失败:', err);
        setError(err.message || '销毁失败');
        throw err;
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 扑克游戏相关功能
  const tokenActivity = {
    // 获取桌子数量
    getTableCount: async () => {
      if (!isInitialized) throw new Error('合约未初始化');
      return contractService.getTableCount();
    },
    
    // 获取桌子信息
    getTableInfo: async (tableId) => {
      if (!isInitialized) throw new Error('合约未初始化');
      return contractService.getTableInfo(tableId);
    },
    
    // 参与游戏（存入代币）
    deposit: async (tableId, amount) => {
      if (!isConnected || !isInitialized) {
        throw new Error('钱包未连接');
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        const receipt = await contractService.depositToTable(tableId, amount);
        
        // 更新余额
        const bcBal = await contractService.getBCBalance();
        setBcBalance(bcBal);
        
        return receipt;
      } catch (err) {
        console.error('存入代币失败:', err);
        setError(err.message || '存入失败');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    
    // 查询存款
    getUserDeposit: async (tableId, userAddress = null) => {
      if (!isInitialized) throw new Error('合约未初始化');
      return contractService.getUserDeposit(tableId, userAddress);
    }
  };

  // 代币兑换相关功能
  const tokenSwap = {
    // 获取兑换信息
    getSwapInfo: async () => {
      if (!isInitialized) throw new Error('合约未初始化');
      return contractService.getSwapInfo();
    },
    
    // 计算BC兑换EDU
    calculateBCtoEDU: async (bcAmount) => {
      if (!isInitialized) throw new Error('合约未初始化');
      return contractService.calculateBCtoEDU(bcAmount);
    },
    
    // 计算EDU兑换BC
    calculateEDUtoBC: async (eduAmount) => {
      if (!isInitialized) throw new Error('合约未初始化');
      return contractService.calculateEDUtoBC(eduAmount);
    },
    
    // BC兑换EDU
    swapBCforEDU: async (bcAmount) => {
      if (!isConnected || !isInitialized) {
        throw new Error('钱包未连接');
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        const receipt = await contractService.swapBCforEDU(bcAmount);
        
        // 更新余额
        await refreshBalances();
        
        return receipt;
      } catch (err) {
        console.error('BC兑换EDU失败:', err);
        setError(err.message || '兑换失败');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    
    // EDU兑换BC
    swapEDUforBC: async (eduAmount) => {
      if (!isConnected || !isInitialized) {
        throw new Error('钱包未连接');
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        const receipt = await contractService.swapEDUforBC(eduAmount);
        
        // 更新余额
        await refreshBalances();
        
        return receipt;
      } catch (err) {
        console.error('EDU兑换BC失败:', err);
        setError(err.message || '兑换失败');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    
    // 添加BC流动性
    addBCLiquidity: async (amount) => {
      if (!isConnected || !isInitialized) {
        throw new Error('钱包未连接');
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        const receipt = await contractService.addBCLiquidity(amount);
        
        // 更新余额
        const bcBal = await contractService.getBCBalance();
        setBcBalance(bcBal);
        
        return receipt;
      } catch (err) {
        console.error('添加BC流动性失败:', err);
        setError(err.message || '添加流动性失败');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    
    // 添加EDU流动性
    addEDULiquidity: async (amount) => {
      if (!isConnected || !isInitialized) {
        throw new Error('钱包未连接');
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        const receipt = await contractService.addEDULiquidity(amount);
        
        // 更新余额
        const ethBal = await contractService.getEthBalance();
        setEthBalance(ethBal);
        
        return receipt;
      } catch (err) {
        console.error('添加EDU流动性失败:', err);
        setError(err.message || '添加流动性失败');
        throw err;
      } finally {
        setIsLoading(false);
      }
    }
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
    tokenSwap
  };
}

export default useContract; 