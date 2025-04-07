'use client';

import { useState } from 'react';
import { useContractContext } from '../contexts/ContractProvider';

/**
 * BattleCoin转账表单组件
 * 
 * 允许用户发送BattleCoin代币
 */
export default function BCTransferForm() {
  const { isConnected, bcBalance, isLoading, battleCoin } = useContractContext();
  
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 重置状态
    setTransactionHash('');
    setSuccess(false);
    setError('');
    
    // 验证表单
    if (!recipient || !amount) {
      setError('请填写所有必填字段');
      return;
    }
    
    try {
      // 执行转账
      const receipt = await battleCoin.transfer(recipient, amount);
      
      // 更新状态
      setTransactionHash(receipt.transactionHash);
      setSuccess(true);
      
      // 清空表单
      setRecipient('');
      setAmount('');
    } catch (err) {
      console.error('转账失败:', err);
      setError(err.message || '转账失败');
    }
  };

  if (!isConnected) {
    return (
      <div className="bc-transfer-form">
        <div className="form-card not-connected">
          <h2>BattleCoin转账</h2>
          <p>请先连接MetaMask钱包以使用此功能</p>
        </div>
        
        <style jsx>{`
          .bc-transfer-form {
            margin: 20px 0;
          }
          
          .form-card {
            background-color: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          
          .not-connected {
            text-align: center;
            color: #718096;
          }
          
          h2 {
            margin: 0 0 16px 0;
            color: #2D3748;
            font-size: 20px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="bc-transfer-form">
      <div className="form-card">
        <h2>BattleCoin转账</h2>
        
        <div className="balance-info">
          <p>当前余额: <strong>{parseFloat(bcBalance).toFixed(4)} BC</strong></p>
        </div>
        
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="success-message">
            <p>转账成功!</p>
            <p className="tx-hash">
              交易哈希: <a
                href={`https://etherscan.io/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {transactionHash.substring(0, 10)}...
              </a>
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="recipient">接收地址:</label>
            <input
              id="recipient"
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="amount">转账金额:</label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.01"
              step="0.000001"
              min="0"
              disabled={isLoading}
              required
            />
          </div>
          
          <button
            type="submit"
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? '处理中...' : '转账'}
          </button>
        </form>
      </div>
      
      <style jsx>{`
        .bc-transfer-form {
          margin: 20px 0;
        }
        
        .form-card {
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
        
        .balance-info {
          background-color: #F7FAFC;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
        }
        
        .error-message {
          background-color: #FEE2E2;
          color: #B91C1C;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
        }
        
        .success-message {
          background-color: #D1FAE5;
          color: #065F46;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
        }
        
        .tx-hash {
          font-size: 14px;
          word-break: break-all;
          margin-top: 8px;
        }
        
        .tx-hash a {
          color: #2563EB;
          text-decoration: underline;
        }
        
        form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        label {
          font-size: 14px;
          font-weight: 500;
          color: #4A5568;
        }
        
        input {
          padding: 10px;
          border: 1px solid #E2E8F0;
          border-radius: 4px;
          font-size: 16px;
        }
        
        .submit-button {
          background-color: #10B981;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
          margin-top: 8px;
        }
        
        .submit-button:hover {
          background-color: #059669;
        }
        
        .submit-button:disabled {
          background-color: #A7F3D0;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
} 