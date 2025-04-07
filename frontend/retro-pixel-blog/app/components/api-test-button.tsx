"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export default function ApiTestButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const testConnection = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      // 直接使用 fetch 测试，避免使用 api-client 中的函数
      const apiUrl = "https://57d5-2409-8962-ace-4cf-34bf-399-87c0-cbd6.ngrok-free.app/api/health"
      console.log(`Testing connection to: ${apiUrl}`)

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        mode: "cors",
        credentials: "omit",
      })

      console.log(`Response status: ${response.status}`)

      if (response.ok) {
        const text = await response.text()
        console.log(`Response body: ${text}`)
        setResult({
          success: true,
          message: `连接成功! 状态码: ${response.status}, 响应: ${text.substring(0, 50)}...`,
        })
      } else {
        const text = await response.text()
        console.log(`Error response: ${text}`)
        setResult({
          success: false,
          message: `请求失败，状态码: ${response.status}, 错误: ${text}`,
        })
      }
    } catch (error) {
      console.error("Connection test failed:", error)
      setResult({
        success: false,
        message: `连接异常: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mt-4">
      <Button
        onClick={testConnection}
        disabled={isLoading}
        className="font-squares text-xs flex items-center gap-2"
        style={{ fontSize: "0.4rem" }}
      >
        {isLoading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            测试中...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4" />
            测试API连接
          </>
        )}
      </Button>

      {result && (
        <div className={`mt-2 p-3 rounded-lg ${result.success ? "bg-green-900" : "bg-red-900"}`}>
          <p className="font-elvpixels03" style={{ fontSize: "0.4rem" }}>
            {result.message}
          </p>
        </div>
      )}
    </div>
  )
}

