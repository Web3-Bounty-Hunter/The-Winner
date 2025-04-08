"use client"

import { useEffect } from "react"
import { useAuth } from "../context/auth-context"
import webSocketService from "../lib/websocket-service-improved"
import { toast } from "sonner"

export default function InitWebSocket() {
  const { user, isLoading } = useAuth()

  useEffect(() => {
    // 初始化WebSocket连接
    webSocketService.connect()

    // 如果用户已登录，则进行认证
    if (user && !isLoading) {
      const token = localStorage.getItem("token")
      if (token) {
        webSocketService.authenticate(token)
      }
    }

    // 添加连接状态监听器
    const handleConnectionChange = (connected: boolean, status?: string) => {
      if (connected) {
        console.log("WebSocket连接已建立")
      } else {
        if (status === "error") {
          toast.error("WebSocket连接错误，部分功能可能不可用")
        } else if (status === "max_attempts") {
          toast.error("无法连接到游戏服务器，请刷新页面重试")
        }
      }
    }

    webSocketService.addConnectionListener(handleConnectionChange)

    // 清理函数
    return () => {
      webSocketService.removeConnectionListener(handleConnectionChange)
    }
  }, [user, isLoading])

  // 这个组件不渲染任何内容
  return null
}

