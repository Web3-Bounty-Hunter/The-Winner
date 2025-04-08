'use client';

import { createContext, useContext, useEffect } from 'react';
import useContract from '../hooks/useContract';

// 创建合约上下文
const ContractContext = createContext(null);

/**
 * 合约上下文提供者组件
 * 
 * 提供整个应用访问合约功能的能力
 * @param {Object} props 
 * @param {React.ReactNode} props.children 子组件
 * @param {boolean} [props.autoInit=false] 是否自动初始化
 */
export function ContractProvider({ children, autoInit = false }) {
  const contract = useContract();
  
  // 如果设置了自动初始化，则在组件挂载时尝试初始化
  useEffect(() => {
    if (autoInit && typeof window !== 'undefined' && window.ethereum) {
      contract.initialize();
    }
  }, [autoInit, contract]);
  
  return (
    <ContractContext.Provider value={contract}>
      {children}
    </ContractContext.Provider>
  );
}

/**
 * 使用合约上下文的自定义Hook
 * 
 * 在组件中使用这个Hook可以访问合约功能
 * @returns {Object} 合约状态和方法
 */
export function useContractContext() {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error('useContractContext必须在ContractProvider内部使用');
  }
  return context;
}

export default ContractProvider; 