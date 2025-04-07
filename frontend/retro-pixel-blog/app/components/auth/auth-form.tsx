"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "../../context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import GlitchEffect from "../GlitchEffect"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type AuthMode = "login" | "register"

export default function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("login")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [apiStatus, setApiStatus] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const router = useRouter()
  const { login, register } = useAuth()

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login")
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setApiStatus(null)
    setIsLoading(true)
    setSuccess(false)

    console.log(`Attempting to ${mode}...`)
    console.log("Form data:", { username, password, email: mode === "register" ? email : undefined })

    try {
      setApiStatus("正在连接到服务器...")

      if (mode === "login") {
        setApiStatus("正在登录...")
        await login(username, password)
        console.log("Login successful")

        // Set success state
        setSuccess(true)

        // Show success toast
        toast.success(`欢迎回来, ${username}!`, {
          duration: 3000,
        })

        // Redirect after a short delay
        setTimeout(() => {
          // Get the return URL from localStorage or default to home
          const returnUrl = localStorage.getItem("returnUrl") || "/"
          localStorage.removeItem("returnUrl") // Clear the stored URL
          router.push(returnUrl)
        }, 1500)
      } else {
        setApiStatus("正在注册...")
        await register(username, password, email)
        console.log("Register successful")

        // Set success state
        setSuccess(true)

        // Show success toast
        toast.success(`账户创建成功, ${username}!`, {
          duration: 3000,
        })

        // Redirect after a short delay
        setTimeout(() => {
          router.push("/")
        }, 1500)
      }
    } catch (err) {
      console.error(`${mode} error:`, err)

      // 提供更友好的错误消息
      let errorMessage = "发生未知错误"

      if (err instanceof Error) {
        // 处理网络错误
        if (err.message.includes("fetch") || err.message.includes("Failed to fetch")) {
          errorMessage = "无法连接到服务器。请检查您的网络连接并确保API服务器正在运行。"
        } else if (err.message.includes("already exists") || err.message.includes("已被使用")) {
          errorMessage = "用户名已被使用，请尝试其他用户名。"
        } else if (err.message.includes("incorrect") || err.message.includes("不正确")) {
          errorMessage = "用户名或密码不正确。"
        } else {
          errorMessage = err.message
        }
      } else if (typeof err === "string") {
        errorMessage = err
      }

      console.error("Detailed error:", errorMessage)
      setError(errorMessage)

      // Show error toast
      toast.error(errorMessage, {
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
      setApiStatus(null)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-gray-800 rounded-lg casino-border">
      <h2 className="text-xs font-squares mb-6 text-center" style={{ fontSize: "0.5rem" }}>
        {mode === "login" ? "登录您的账户" : "创建新账户"}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-900 rounded-lg text-center">
          <p className="font-elvpixels03 text-xs" style={{ fontSize: "0.4rem" }}>
            {error}
          </p>
        </div>
      )}

      {apiStatus && (
        <div className="mb-4 p-3 bg-blue-900 rounded-lg text-center">
          <p className="font-elvpixels03 text-xs" style={{ fontSize: "0.4rem" }}>
            {apiStatus}
          </p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-900 rounded-lg text-center">
          <p className="font-elvpixels03 text-xs" style={{ fontSize: "0.4rem" }}>
            {mode === "login" ? "登录成功！正在跳转..." : "注册成功！正在跳转..."}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block font-squares text-xs mb-1" style={{ fontSize: "0.4rem" }}>
            用户名
          </label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="font-elvpixels03"
            style={{ fontSize: "0.4rem" }}
          />
        </div>

        {mode === "register" && (
          <div>
            <label htmlFor="email" className="block font-squares text-xs mb-1" style={{ fontSize: "0.4rem" }}>
              邮箱 (可选)
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="font-elvpixels03"
              style={{ fontSize: "0.4rem" }}
            />
          </div>
        )}

        <div>
          <label htmlFor="password" className="block font-squares text-xs mb-1" style={{ fontSize: "0.4rem" }}>
            密码
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="font-elvpixels03"
            style={{ fontSize: "0.4rem" }}
          />
        </div>

        <GlitchEffect triggerOnHover={true}>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full font-squares text-xs"
            style={{ fontSize: "0.4rem" }}
          >
            {isLoading ? (mode === "login" ? "登录中..." : "注册中...") : mode === "login" ? "登录" : "注册"}
          </Button>
        </GlitchEffect>
      </form>

      <div className="mt-4 text-center">
        <button
          onClick={toggleMode}
          className="font-elvpixels03 text-xs text-purple-400 hover:text-purple-300"
          style={{ fontSize: "0.4rem" }}
        >
          {mode === "login" ? "需要一个账户？注册" : "已有账户？登录"}
        </button>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-700">
        <p className="font-elvpixels03 text-xs text-center" style={{ fontSize: "0.35rem" }}>
          API URL: {process.env.NEXT_PUBLIC_API_BASE_URL || "未设置"}
        </p>
      </div>
    </div>
  )
}

