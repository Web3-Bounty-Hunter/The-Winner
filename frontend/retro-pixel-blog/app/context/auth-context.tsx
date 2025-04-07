"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import {
  type User,
  getCurrentUser,
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  testApiConnection,
} from "../lib/api-client"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  apiStatus: "unknown" | "connected" | "disconnected"
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, email?: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [apiStatus, setApiStatus] = useState<"unknown" | "connected" | "disconnected">("unknown")

  // 测试 API 连接
  useEffect(() => {
    async function checkApiConnection() {
      try {
        const result = await testApiConnection()
        setApiStatus(result.success ? "connected" : "disconnected")
        console.log("API connection test result:", result)
      } catch (error) {
        console.error("API connection test error:", error)
        setApiStatus("disconnected")
      }
    }

    checkApiConnection()
  }, [])

  useEffect(() => {
    async function loadUser() {
      console.log("AuthProvider: Loading user...")
      try {
        const userData = await getCurrentUser()
        console.log("AuthProvider: User data loaded:", userData)
        setUser(userData)
      } catch (error) {
        console.error("AuthProvider: Failed to load user:", error)
      } finally {
        setIsLoading(false)
        console.log("AuthProvider: User loading completed")
      }
    }

    loadUser()
  }, [])

  const login = async (username: string, password: string) => {
    console.log("AuthProvider: Login attempt for user:", username)
    setIsLoading(true)
    try {
      const { user } = await apiLogin(username, password)
      console.log("AuthProvider: Login successful, user:", user)
      setUser(user)
    } catch (error) {
      console.error("AuthProvider: Login failed:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (username: string, password: string, email?: string) => {
    console.log("AuthProvider: Register attempt for user:", username)
    setIsLoading(true)
    try {
      // 检查 API 连接状态
      if (apiStatus === "disconnected") {
        throw new Error("Cannot connect to the server. Please check your network connection and try again.")
      }

      console.log("AuthProvider: Calling apiRegister...")
      const result = await apiRegister(username, password, email)
      console.log("AuthProvider: Register successful, result:", result)
      setUser(result.user)
    } catch (error) {
      console.error("AuthProvider: Register failed:", error)
      throw error
    } finally {
      setIsLoading(false)
      console.log("AuthProvider: Register process completed")
    }
  }

  const logout = () => {
    console.log("AuthProvider: Logging out...")
    apiLogout()
    setUser(null)
    console.log("AuthProvider: Logout completed")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        apiStatus,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

