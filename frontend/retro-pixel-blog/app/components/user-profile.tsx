"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/auth-context"
import { getTransactions, type Transaction } from "../lib/api-client"
import { Coins } from "lucide-react"
import GlitchEffect from "./GlitchEffect"
import { useSocket } from '../providers/socket-provider'

export default function UserProfile() {
  const { user, logout } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { isConnected, socketClient, userId, playerId } = useSocket()

  useEffect(() => {
    if (user) {
      loadTransactions()
    }
  }, [user])

  const loadTransactions = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const response = await getTransactions(5, 0)
      setTransactions(response.transactions)
    } catch (error) {
      console.error("Failed to load transactions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="p-6 bg-gray-800 rounded-lg casino-border">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xs font-squares" style={{ fontSize: "0.5rem" }}>
          User Profile
        </h2>
        <GlitchEffect triggerOnHover={true}>
          <button
            onClick={logout}
            className="pixelated-border p-2 bg-red-900 hover:bg-red-800 transition-colors font-squares text-xs"
            style={{ fontSize: "0.35rem" }}
          >
            Logout
          </button>
        </GlitchEffect>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-squares text-xs" style={{ fontSize: "0.4rem" }}>
            Username:
          </span>
          <span className="font-elvpixels03" style={{ fontSize: "0.4rem" }}>
            {user.username}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className="font-squares text-xs" style={{ fontSize: "0.4rem" }}>
            Coins:
          </span>
          <span className="font-elvpixels03 text-yellow-400" style={{ fontSize: "0.4rem" }}>
            {user.coins}
          </span>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-squares mb-4" style={{ fontSize: "0.45rem" }}>
          Recent Transactions
        </h3>

        {isLoading ? (
          <p className="font-elvpixels03 text-center" style={{ fontSize: "0.4rem" }}>
            Loading...
          </p>
        ) : transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="p-3 bg-gray-700 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-elvpixels03" style={{ fontSize: "0.4rem" }}>
                    {transaction.description}
                  </span>
                  <span
                    className={`font-squares ${transaction.amount > 0 ? "text-green-400" : "text-red-400"}`}
                    style={{ fontSize: "0.4rem" }}
                  >
                    {transaction.amount > 0 ? "+" : ""}
                    {transaction.amount}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-elvpixels03 text-gray-400" style={{ fontSize: "0.35rem" }}>
                    {new Date(transaction.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-elvpixels03 text-center" style={{ fontSize: "0.4rem" }}>
            No transactions yet
          </p>
        )}
      </div>

      <div className="connection-status">
        状态: {isConnected ? '已连接' : '未连接'}
      </div>
      {isConnected && (
        <div className="room-info">
          用户ID: {userId || '游客'} | 玩家ID: {playerId || '未分配'}
        </div>
      )}
    </div>
  )
}

