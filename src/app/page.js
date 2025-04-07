'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './page.module.css';
import { ContractProvider } from './contexts/ContractProvider';
import WalletSection from './components/WalletSection';
import BCTransferForm from './components/BCTransferForm';
import TokenSwapForm from './components/TokenSwapForm';
import LoginButton from './components/LoginButton';

// OCID导入
import { useOCAuth } from '@opencampus/ocid-connect-js';

export default function Home() {
  // 获取OCID身份验证状态和方法
  const { isInitialized, authState, ocAuth } = useOCAuth();
  // 标记是否处于沙盒模式
  const [isSandbox, setIsSandbox] = useState(false);
  // 选中的功能选项卡
  const [activeTab, setActiveTab] = useState('wallet');

  // 当SDK尚未初始化完成时显示加载状态
  if (!isInitialized) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p style={{marginTop: '20px', fontSize: '18px'}}>初始化 OCID 钱包中...</p>
      </div>
    );
  }

  // 出现错误时显示错误信息
  if (authState.error) {
    return (
      <div className={styles.errorContainer}>
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#E53E3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h2 style={{color: '#E53E3E', marginTop: '20px'}}>连接错误</h2>
        <p>{authState.error.message}</p>
      </div>
    );
  }

  // 主界面渲染
  return (
    <div className={styles.container}>
      {/* 页面头部 */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
          <h1>区块链钱包演示</h1>
        </div>
        <div className={styles.environmentBadge}>
          {isSandbox ? '沙盒模式' : ''}
        </div>
      </header>

      {/* 主体内容 */}
      <main className={styles.main}>
        {/* 根据认证状态显示不同内容 */}
        {authState.isAuthenticated ? (
          // 已认证状态显示功能页面
          <div className={styles.dashboard}>
            {/* OCID信息卡片 */}
            <div className={styles.card}>
              <h2>OCID 身份</h2>
              <div className={styles.ocidInfo}>
                <div className={styles.infoRow}>
                  <span>OCID:</span>
                  <span className={styles.ocidValue}>{authState.OCId || 'N/A'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span>以太坊地址:</span>
                  <span className={styles.addressValue}>
                    {authState.ethAddress 
                      ? `${authState.ethAddress.substring(0, 6)}...${authState.ethAddress.substring(38)}` 
                      : 'N/A'}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span>授权状态:</span>
                  <span className={styles.statusBadge}>已授权</span>
                </div>
                
                <button 
                  className={styles.logoutButton}
                  onClick={() => ocAuth.logout()}
                >
                  退出OCID登录
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </button>
              </div>
            </div>
            
            {/* 功能选项卡 */}
            <div className={styles.tabs}>
              <button 
                className={`${styles.tab} ${activeTab === 'wallet' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('wallet')}
              >
                MetaMask钱包
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'transfer' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('transfer')}
              >
                BC转账
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'swap' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('swap')}
              >
                代币兑换
              </button>
            </div>
            
            {/* 根据选项卡显示不同功能组件 */}
            <ContractProvider autoInit={true}>
              <div className={styles.tabContent}>
                {activeTab === 'wallet' && <WalletSection />}
                {activeTab === 'transfer' && <BCTransferForm />}
                {activeTab === 'swap' && <TokenSwapForm />}
              </div>
            </ContractProvider>
            
          </div>
        ) : (
          // 未认证状态显示登录按钮
          <div className={styles.loginCard}>
            <h2>区块链钱包与DApp演示</h2>
            <p>连接您的 OCID 钱包以访问完整功能</p>
            <div className={styles.loginButtonContainer}>
              <LoginButton />
            </div>
            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <span>使用OCID安全认证</span>
              </div>
              <div className={styles.featureItem}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
                <span>连接MetaMask钱包</span>
              </div>
              <div className={styles.featureItem}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="16" y2="16"></line>
                </svg>
                <span>BattleCoin代币管理</span>
              </div>
              <div className={styles.featureItem}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                  <polyline points="17 6 23 6 23 12"></polyline>
                </svg>
                <span>代币兑换功能</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 页脚 */}
      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} 区块链钱包演示</p>
      </footer>
    </div>
  );
} 