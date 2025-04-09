'use client';

import { useState } from 'react';
import { useContractContext } from '../contexts/ContractProvider';

/**
 * 钱包区域组件
 * 
 * 显示钱包连接状态、余额，提供钱包连接功能
 */
export default function WalletSection() {
  const { 
    isConnected, 
    address, 
    ethBalance, 
    bcBalance, 
    chainId, 
    isLoading, 
    error, 
    connectWallet, 
    refreshBalances 
  } = useContractContext();

  // 截断地址显示
  const shortenAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="wallet-section">
      <div className="wallet-card">
        <h2>钱包状态</h2>
        
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}
        
        {isConnected ? (
          <div className="wallet-info">
            <div className="info-row">
              <span>地址:</span>
              <span className="address">{shortenAddress(address)}</span>
            </div>
            
            <div className="info-row">
              <span>ETH余额:</span>
              <span>{parseFloat(ethBalance).toFixed(4)} ETH</span>
            </div>
            
            <div className="info-row">
              <span>BC余额:</span>
              <span>{parseFloat(bcBalance).toFixed(4)} BC</span>
            </div>
            
            <div className="info-row">
              <span>网络ID:</span>
              <span>{chainId}</span>
            </div>
            
            <button
              className="refresh-button"
              onClick={refreshBalances}
              disabled={isLoading}
            >
              {isLoading ? '刷新中...' : '刷新余额'}
            </button>
          </div>
        ) : (
          <div className="connect-wallet">
            <p>请连接您的MetaMask钱包以访问完整功能</p>
            <button
              className="connect-button"
              onClick={connectWallet}
              disabled={isLoading}
            >
              {isLoading ? '连接中...' : '连接MetaMask'}
            </button>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .wallet-section {
          margin: 20px 0;
        }
        
        .wallet-card {
          background-color: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        h2 {
          margin: 0 0 16px 0;
          color: #2D3748;
          font-size: 20px;
        }
        
        .error-message {
          background-color: #FEE2E2;
          color: #B91C1C;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
        }
        
        .wallet-info {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #E2E8F0;
        }
        
        .address {
          font-family: monospace;
          font-weight: bold;
        }
        
        .connect-wallet {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        
        .connect-button {
          background-color: #4F46E5;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .connect-button:hover {
          background-color: #3730A3;
        }
        
        .connect-button:disabled {
          background-color: #A5B4FC;
          cursor: not-allowed;
        }
        
        .refresh-button {
          background-color: #10B981;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          margin-top: 8px;
          transition: background-color 0.3s;
        }
        
        .refresh-button:hover {
          background-color: #059669;
        }
        
        .refresh-button:disabled {
          background-color: #A7F3D0;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
} 