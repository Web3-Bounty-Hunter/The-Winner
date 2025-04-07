'use client';

import { useState, useEffect } from 'react';
import { useContractContext } from '../contexts/ContractProvider';

/**
 * 代币兑换表单组件
 * 
 * 用于BC和EDU之间的兑换
 */
export default function TokenSwapForm() {
  const { isConnected, isLoading, tokenSwap } = useContractContext();
  
  const [swapType, setSwapType] = useState('bcToEdu'); // 'bcToEdu' 或 'eduToBc'
  const [amount, setAmount] = useState('');
  const [expectedAmount, setExpectedAmount] = useState('0');
  const [swapInfo, setSwapInfo] = useState(null);
  const [transactionHash, setTransactionHash] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  // 获取兑换信息
  useEffect(() => {
    const fetchSwapInfo = async () => {
      if (!isConnected) return;
      
      try {
        setLocalLoading(true);
        const info = await tokenSwap.getSwapInfo();
        setSwapInfo(info);
      } catch (err) {
        console.error('获取兑换信息失败:', err);
        setError('获取兑换信息失败');
      } finally {
        setLocalLoading(false);
      }
    };
    
    fetchSwapInfo();
  }, [isConnected, tokenSwap]);

  // 计算预期获得金额
  useEffect(() => {
    const calculateExpectedAmount = async () => {
      if (!isConnected || !amount || amount <= 0) {
        setExpectedAmount('0');
        return;
      }
      
      try {
        setLocalLoading(true);
        let expected;
        
        if (swapType === 'bcToEdu') {
          expected = await tokenSwap.calculateBCtoEDU(amount);
        } else {
          expected = await tokenSwap.calculateEDUtoBC(amount);
        }
        
        setExpectedAmount(expected);
      } catch (err) {
        console.error('计算预期金额失败:', err);
        setExpectedAmount('0');
      } finally {
        setLocalLoading(false);
      }
    };
    
    calculateExpectedAmount();
  }, [isConnected, amount, swapType, tokenSwap]);

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 重置状态
    setTransactionHash('');
    setSuccess(false);
    setError('');
    
    // 验证表单
    if (!amount || parseFloat(amount) <= 0) {
      setError('请输入有效金额');
      return;
    }
    
    try {
      setLocalLoading(true);
      
      // 执行兑换
      let receipt;
      
      if (swapType === 'bcToEdu') {
        receipt = await tokenSwap.swapBCforEDU(amount);
      } else {
        receipt = await tokenSwap.swapEDUforBC(amount);
      }
      
      // 更新状态
      setTransactionHash(receipt.transactionHash);
      setSuccess(true);
      
      // 清空表单
      setAmount('');
      setExpectedAmount('0');
      
      // 更新兑换信息
      const info = await tokenSwap.getSwapInfo();
      setSwapInfo(info);
    } catch (err) {
      console.error('兑换失败:', err);
      setError(err.message || '兑换失败');
    } finally {
      setLocalLoading(false);
    }
  };

  // 切换兑换类型
  const toggleSwapType = () => {
    setSwapType(swapType === 'bcToEdu' ? 'eduToBc' : 'bcToEdu');
    setAmount('');
    setExpectedAmount('0');
  };

  if (!isConnected) {
    return (
      <div className="token-swap-form">
        <div className="form-card not-connected">
          <h2>代币兑换</h2>
          <p>请先连接MetaMask钱包以使用此功能</p>
        </div>
        
        <style jsx>{`
          .token-swap-form {
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
    <div className="token-swap-form">
      <div className="form-card">
        <h2>代币兑换</h2>
        
        {swapInfo && (
          <div className="swap-info">
            <p>BC : EDU = 1 : {parseFloat(1 / swapInfo.bcToEduRate).toFixed(6)}</p>
            <p>EDU兑换BC奖励: {(parseFloat(swapInfo.eduToBcBonus) / 100).toFixed(2)}%</p>
            <p>手续费: {(parseFloat(swapInfo.feePercentage) / 100).toFixed(2)}%</p>
            <div className="liquidity-info">
              <p>BC流动性: {parseFloat(swapInfo.bcLiquidity).toFixed(4)} BC</p>
              <p>EDU流动性: {parseFloat(swapInfo.eduLiquidity).toFixed(4)} EDU</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="success-message">
            <p>兑换成功!</p>
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
        
        <div className="swap-selector">
          <button
            type="button"
            className={`swap-tab ${swapType === 'bcToEdu' ? 'active' : ''}`}
            onClick={() => setSwapType('bcToEdu')}
            disabled={isLoading || localLoading}
          >
            BC → EDU
          </button>
          <button
            type="button"
            className={`swap-tab ${swapType === 'eduToBc' ? 'active' : ''}`}
            onClick={() => setSwapType('eduToBc')}
            disabled={isLoading || localLoading}
          >
            EDU → BC
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="amount">
              {swapType === 'bcToEdu' ? 'BC金额:' : 'EDU金额:'}
            </label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.01"
              step="0.000001"
              min="0"
              disabled={isLoading || localLoading}
              required
            />
          </div>
          
          <div className="expected-amount">
            <p>
              预计获得:
              <strong>
                {parseFloat(expectedAmount).toFixed(6)} {swapType === 'bcToEdu' ? 'EDU' : 'BC'}
              </strong>
            </p>
          </div>
          
          <button
            type="submit"
            className="submit-button"
            disabled={isLoading || localLoading || !amount || parseFloat(amount) <= 0}
          >
            {isLoading || localLoading ? '处理中...' : '兑换'}
          </button>
        </form>
      </div>
      
      <style jsx>{`
        .token-swap-form {
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
        
        .swap-info {
          background-color: #EFF6FF;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
        }
        
        .liquidity-info {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px dashed #BFDBFE;
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
        
        .swap-selector {
          display: flex;
          margin-bottom: 16px;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #E2E8F0;
        }
        
        .swap-tab {
          flex: 1;
          padding: 12px;
          border: none;
          background-color: #F8FAFC;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        
        .swap-tab.active {
          background-color: #4F46E5;
          color: white;
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
        
        .expected-amount {
          background-color: #F7FAFC;
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
        }
        
        .submit-button {
          background-color: #8B5CF6;
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
          background-color: #7C3AED;
        }
        
        .submit-button:disabled {
          background-color: #C4B5FD;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
} 