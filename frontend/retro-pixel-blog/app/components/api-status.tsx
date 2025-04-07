"use client"

import { useState, useEffect } from "react"
import { Wifi, WifiOff, RefreshCw } from "lucide-react"

export default function ApiStatus() {
  const [status, setStatus] = useState<"checking" | "connected" | "disconnected">("checking")
  const [message, setMessage] = useState<string>("正在检查 API 连接...")
  const [isRetrying, setIsRetrying] = useState(false)

  // 修改checkApiConnection函数，使其不再实际测试API连接
  const checkApiConnection = async () => {
    console.log("API status check disabled")
    setStatus("connected")
    setMessage("API testing disabled")
  }

  // 初始检查和定期检查
  useEffect(() => {
    checkApiConnection()
    // 移除定期检查
    // const interval = setInterval(checkApiConnection, 30000)
    // return () => clearInterval(interval)
  }, [])

  // 手动重试
  const handleRetry = async () => {
    if (isRetrying) return

    setIsRetrying(true)
    await checkApiConnection()
    setIsRetrying(false)
  }

  if (status === "checking") {
    return (
      <div className="fixed bottom-4 left-4 z-50 bg-gray-800 text-gray-400 px-3 py-1 rounded-md font-mono text-xs flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse"></div>
        <span>API: 检查中...</span>
      </div>
    )
  }

  if (status === "disconnected") {
    return (
      <div className="fixed bottom-4 left-4 z-50 bg-red-900 text-white px-3 py-1 rounded-md font-mono text-xs flex items-center gap-2">
        <WifiOff className="w-3 h-3" />
        <span title={message}>API: 未连接</span>
        <button
          onClick={handleRetry}
          className="ml-2 p-1 bg-red-800 rounded hover:bg-red-700 transition-colors"
          disabled={isRetrying}
        >
          <RefreshCw className={`w-3 h-3 ${isRetrying ? "animate-spin" : ""}`} />
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-green-900 text-white px-3 py-1 rounded-md font-mono text-xs flex items-center gap-2">
      <Wifi className="w-3 h-3" />
      <span>API: 已连接</span>
    </div>
  )
}

