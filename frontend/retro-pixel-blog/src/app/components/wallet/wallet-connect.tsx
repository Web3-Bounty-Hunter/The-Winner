'use client';
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const MetamaskConnect = () => {
    const [account, setAccount] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [provider, setProvider] = useState(null);
    const [chainId, setChainId] = useState(null);

    const REQUIRED_CHAIN_ID = 656476; // 设置所需的链ID

    const switchNetwork = async () => {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${REQUIRED_CHAIN_ID.toString(16)}` }],
            });
        } catch (switchError) {
            // 如果网络不存在，则添加网络
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: `0x${REQUIRED_CHAIN_ID.toString(16)}`,
                            chainName: 'Your Network Name',
                            nativeCurrency: {
                                name: 'ETH',
                                symbol: 'ETH',
                                decimals: 18
                            },
                            rpcUrls: ['你的RPC URL'],
                            blockExplorerUrls: ['你的区块浏览器URL']
                        }]
                    });
                } catch (addError) {
                    console.error('添加网络失败:', addError);
                }
            }
            console.error('切换网络失败:', switchError);
        }
    };

    const connectToMetamask = async () => {
        try {
            if (window.ethereum) {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                const ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
                const network = await ethersProvider.getNetwork();
                setChainId(network.chainId);
                
                if (network.chainId !== REQUIRED_CHAIN_ID) {
                    await switchNetwork();
                }

                setProvider(ethersProvider);
                const signer = ethersProvider.getSigner();
                const address = await signer.getAddress();
                setAccount(address);
                setIsConnected(true);
            } else {
                console.log('未找到 Metamask 钱包！');
            }
        } catch (error) {
            console.error('连接 Metamask 时出错:', error);
        }
    };

    useEffect(() => {
        // 监听网络变化
        const handleChainChanged = async (newChainId) => {
            const chainIdNum = parseInt(newChainId, 16);
            setChainId(chainIdNum);
            
            if (chainIdNum !== REQUIRED_CHAIN_ID) {
                setAccount(null);
                setIsConnected(false);
                setProvider(null);
                alert('请切换到正确的网络');
                await switchNetwork();
            } else {
                // 重新连接正确的网络
                const ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
                setProvider(ethersProvider);
                const signer = ethersProvider.getSigner();
                const address = await signer.getAddress();
                setAccount(address);
                setIsConnected(true);
            }
        };

        if (window.ethereum) {
            window.ethereum.on('chainChanged', handleChainChanged);
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
        };
    }, []);

    const formatAddress = (address) => {
        if (!address) return '';
        return `${address.slice(0, 5)}...${address.slice(-3)}`;
    };

    // 添加获取provider和signer的方法
    const getProvider = () => {
        if (!provider) {
            throw new Error('Provider未初始化');
        }
        return provider;
    };

    const getSigner = async () => {
        const currentProvider = getProvider();
        return currentProvider.getSigner();
    };

    // 添加获取当前账户地址的方法
    const getCurrentAccount = () => {
        if (!account) {
            throw new Error('钱包未连接');
        }
        return account;
    };

    // 将方法暴露到window对象，供其他组件使用
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.walletUtils = {
                getProvider,
                getSigner,
                getCurrentAccount,
                isConnected: () => isConnected,
            };
        }
        
        return () => {
            if (typeof window !== 'undefined') {
                delete window.walletUtils;
            }
        };
    }, [provider, account, isConnected]);

    return (
        <div>
            {isConnected ? (
                <p className="text-[0.35rem] font-squares">{formatAddress(account)}</p>
            ) : (
                <button className="flex items-center gap-1 px-2 py-1 pixelated-border bg-gray-800 hover:bg-gray-700 rounded transition-colors" onClick={connectToMetamask}>
                <span className="text-green-400 font-squares text-[0.35rem]">Connect</span>
                </button>
            )}
        </div>
    );
};

// 添加TypeScript类型声明
declare global {
    interface Window {
        walletUtils: {
            getProvider: () => ethers.providers.Web3Provider;
            getSigner: () => Promise<ethers.providers.JsonRpcSigner>;
            getCurrentAccount: () => string;
            isConnected: () => boolean;
        };
    }
}

export default MetamaskConnect;    