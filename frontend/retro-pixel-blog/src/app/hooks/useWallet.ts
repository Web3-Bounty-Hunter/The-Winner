import { useState, useCallback, useEffect } from 'react';
import walletService from '../contracts/ContractService';

const useWallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [chainId, setChainId] = useState('');
  const [ethBalance, setEthBalance] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = useCallback(async () => {
    if (isLoading) return; // 防止重复调用

    try {
      setIsLoading(true);
      setError(null);

      const walletAddress = await walletService.connectWallet();
      setAddress(walletAddress);
      setIsConnected(true);

      const network = await walletService.provider.getNetwork();
      setChainId(network.chainId.toString());

      const balance = await walletService.getEthBalance();
      setEthBalance(balance);

      return walletAddress;
    } catch (err) {
      console.error('连接钱包失败:', err);
      if (err.message === '请安装MetaMask以继续使用应用') {
        setError('MetaMask未安装，请安装MetaMask扩展并刷新页面。');
      } else if (err.message === '您拒绝了连接钱包的请求，请授权连接以继续使用应用') {
        setError('您拒绝了连接请求，请授权MetaMask连接以继续使用应用。');
      } else if (err.message.includes('MetaMask请求已在处理中')) {
        setError('MetaMask请求已在处理中，请检查MetaMask扩展并完成操作。');
      } else {
        setError('连接钱包失败：' + (err.message || '未知错误，请检查网络或MetaMask设置'));
      }
      setIsConnected(false);
      setAddress('');
      setChainId('');
      setEthBalance('');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const disconnectWallet = useCallback(() => {
    walletService.disconnect();
    setIsConnected(false);
    setAddress('');
    setChainId('');
    setEthBalance('');
    setError(null);
  }, []);

  // 监听MetaMask事件，避免重复触发
  useEffect(() => {
    if (!window.ethereum) return;

    let isConnecting = false;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (isConnecting) return; // 防抖
      isConnecting = true;

      try {
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (accounts[0] !== address) {
          await connectWallet();
        }
      } finally {
        isConnecting = false;
      }
    };

    const handleChainChanged = async () => {
      if (isConnecting) return; // 防抖
      isConnecting = true;

      try {
        await connectWallet();
      } finally {
        isConnecting = false;
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [address, connectWallet, disconnectWallet]);

  // 自动检查现有连接
  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) return;
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        await connectWallet();
      }
    };
    checkConnection();
  }, [connectWallet]);

  return {
    isConnected,
    address,
    chainId,
    ethBalance,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
    clearError: () => setError(null),
  };
};

export default useWallet;