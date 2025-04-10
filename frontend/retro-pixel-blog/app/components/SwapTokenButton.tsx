"use client"

import type React from "react"

import { useState } from "react"
import { ArrowDownUp, X, ArrowRight } from "lucide-react"
import GlitchEffect from "./GlitchEffect"

export default function SwapTokenButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [amount, setAmount] = useState("1000")
  const [receiveAmount, setReceiveAmount] = useState("1")
  const [swapping, setSwapping] = useState(false)
  const [swapSuccess, setSwapSuccess] = useState(false)

  const handleSwap = () => {
    setSwapping(true)
    // 模拟交换过程
    setTimeout(() => {
      setSwapping(false)
      setSwapSuccess(true)
      setTimeout(() => {
        setSwapSuccess(false)
        setIsOpen(false)
      }, 2000)
    }, 1500)
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value)
      // 更新接收金额的计算逻辑
      const numValue = Number.parseFloat(value) || 0
      setReceiveAmount((numValue / 1000).toString())
    }
  }

  if (!isOpen) {
    return (
      <GlitchEffect triggerOnHover={true}>
        <button
          onClick={() => setIsOpen(true)}
          className="pixelated-border p-3 bg-purple-800 hover:bg-purple-700 transition-colors font-squares text-xs flex items-center gap-2"
          style={{ fontSize: "0.2rem" }}
        >
          <ArrowDownUp className="w-4 h-4" />
          <span>Swap EduToken</span>
        </button>
      </GlitchEffect>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl max-w-md w-full border border-purple-700 overflow-hidden">
        <div className="bg-purple-800 p-4 text-white flex justify-between items-center">
          <h3 className="text-lg font-squares" style={{ fontSize: "0.2rem" }}>Swap EduToken</h3>
          <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {swapSuccess ? (
            <div className="text-center py-8">
              <div className="text-green-500 text-xl mb-2" style={{ fontSize: "0.5rem" }}>Swap Successful!</div>
              <p className="text-gray-300">You have successfully swapped your tokens.</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="block text-gray-400 text-sm" style={{ fontSize: "0.35rem" }}>You Pay</label>
                <div className="flex items-center bg-gray-800 rounded-md p-3 border border-gray-700" style={{ fontSize: "0.35rem" }}>
                  <input
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                    className="bg-transparent text-white flex-1 outline-none"
                    placeholder="0.0"
                    disabled={swapping}
                    style={{ lineHeight: "6.5" }}
                  />
                  <div className="flex items-center gap-2 bg-purple-900 px-3 py-1 rounded-md">
                    <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                    <span className="text-white font-bold">BCT</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-gray-400 text-sm" style={{ fontSize: "0.35rem" }}>You Receive</label>
                <div className="flex items-center bg-gray-800 rounded-md p-3 border border-gray-700" style={{ fontSize: "0.35rem" }}>
                  <input
                    type="text"
                    value={receiveAmount}
                    className="bg-transparent text-white flex-1 outline-none"
                    placeholder="0.0"
                    disabled
                    style={{ lineHeight: "6.5"}}
                  />
                  <div className="flex items-center gap-2 bg-cyan-900 px-3 py-1 rounded-md">
                    <div className="w-4 h-4 rounded-full bg-cyan-500"></div>
                    <span className="text-white font-bold">EDU</span>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleSwap}
                  disabled={swapping || !amount || Number.parseFloat(amount) <= 0}
                  className={`w-full py-3 rounded-md font-bold ${
                    swapping || !amount || Number.parseFloat(amount) <= 0
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-purple-600 text-white hover:bg-purple-700"
                  } transition-colors`}
                  style={{ fontSize: "0.35rem" }}
                >
                  {swapping ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                      <span>Swapping...</span>
                    </div>
                  ) : (
                    "Swap Tokens"
                  )}
                </button>
              </div>

              <div className="text-xs text-gray-500 pt-2" style={{ fontSize: "0.35rem" }}>
                <p>Exchange Rate: 1000 BCT = 1 EDU</p>
                <p>Gas Fee: ~0.00000234 edu</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
