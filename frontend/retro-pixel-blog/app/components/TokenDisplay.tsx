"use client"

import { useEffect, useState } from "react"
import { Coins, User } from "lucide-react"
import GlitchEffect from "./GlitchEffect"
import MetamaskConnect from "../../src/app/components/wallet/wallet-connect"
import LoginButton from "./LoginButton"
import { ethers } from "ethers"
import { CONTRACT_ADDRESSES, BATTLE_COIN_ABI } from "../../src/app/contracts/ContractConfig"
import SwapTokenButton from "./SwapTokenButton"


const TokenDisplay = () => {
  const [isGlitching, setIsGlitching] = useState(false)
  const [isFlipping, setIsFlipping] = useState(false)
  const [pendingTokens, setPendingTokens] = useState(0)  // 待领取的代币数量
  const [tokens, setTokens] = useState(100)  // 当前拥有的代币数量

  // 添加一个更新 pendingTokens 的方法
  const updatePendingTokens = (amount: number) => {
    setPendingTokens(prev => prev + amount);
  };

  useEffect(() => {
    // 监听 pendingTokensUpdate 事件
    const handlePendingTokensUpdate = (event: CustomEvent) => {
      const amount = event.detail;
      updatePendingTokens(amount);
    };

    window.addEventListener("pendingTokensUpdate", handlePendingTokensUpdate as EventListener);

    return () => {
      window.removeEventListener("pendingTokensUpdate", handlePendingTokensUpdate as EventListener);
    };
  }, []);

  useEffect(() => {
    // Listen for token updates
    const handleTokenUpdate = () => {
      // Glitch effect when tokens change
      setIsGlitching(true)
      setTimeout(() => setIsGlitching(false), 1000)

      // Coin flip animation
      setIsFlipping(true)
      setTimeout(() => setIsFlipping(false), 2000)
    }

    window.addEventListener("tokenUpdate", handleTokenUpdate)

    return () => {
      window.removeEventListener("tokenUpdate", handleTokenUpdate)
    }
  }, [])

  const handleMint = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("请先安装 MetaMask");
      }

      const provider = window.walletUtils.getProvider();
      const signer = await window.walletUtils.getSigner();
      const account = window.walletUtils.getCurrentAccount();
      
      // 创建合约实例
      const battleCoinContract = new ethers.Contract(
        CONTRACT_ADDRESSES.BATTLE_COIN,
        BATTLE_COIN_ABI,
        signer
      );

      // 调用合约的 mint 方法
      const tx = await battleCoinContract.mint(
        await signer.getAddress(),
        pendingTokens
      );
      
      // 等待交易确认
      await tx.wait();
      
      // 更新状态
      setTokens(prev => prev + pendingTokens);
      setPendingTokens(0);

      // 触发动画效果
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), 1000);

      setIsFlipping(true);
      setTimeout(() => setIsFlipping(false), 2000);

      // 触发自定义事件
      window.dispatchEvent(new Event("tokenUpdate"));
    } catch (error) {
      console.error("Mint failed:", error);
      alert("铸造代币失败：" + (error.message || "未知错误"));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <MetamaskConnect />
        <LoginButton />
      </div>
      <GlitchEffect triggerOnHover={true}>
      
        <div className="flex items-center gap-3 px-5 py-3 pixelated-border bg-gray-800 hover:bg-gray-700 rounded transition-colors">
          <div className="flex items-center gap-1">
            <Coins size={12} className="text-yellow-400" />
            <span className="text-yellow-400 font-squares text-[0.35rem]">{tokens}</span>
          </div>
          { (
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-squares text-[0.35rem]">+{pendingTokens}</span>
              <button 
                onClick={handleMint}
                className="px-2 py-1 text-[0.35rem] font-squares text-green-400 hover:text-green-300 transition-colors"
              >
                mint
              </button>
            </div>
          )}
        </div>
      </GlitchEffect>

      <SwapTokenButton />
      
     
      
          

      <style jsx>{`
        .wallet-connect-wrapper :global(button) {
          font-family: 'squares', monospace;
          font-size: 0.35rem;
          background: transparent;
          color: #4ade80;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: color 0.3s;
        }
        
        .wallet-connect-wrapper :global(button:hover) {
          color: #22c55e;
        }
        
        .wallet-connect-wrapper :global(p) {
          font-family: 'squares', monospace;
          font-size: 0.35rem;
          color: #4ade80;
          margin: 0;
        }
      `}</style>
    </div>
  )
}

export default TokenDisplay

