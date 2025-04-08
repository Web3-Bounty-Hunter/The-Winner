"use client"

import { useState, useEffect } from "react"
import ApiTestButton from "./api-test-button"

export default function EnvDebug() {
  const [isVisible, setIsVisible] = useState(false)
  const [envInfo, setEnvInfo] = useState({
    apiBaseUrl: "",
    wsUrl: "",
    nodeEnv: "",
    browserInfo: "",
    origin: "",
  })
  const [/* apiTestResult, */ setApiTestResult] = useState<string | null>(null)
  const [/* isTestingApi, */ setIsTestingApi] = useState(false)

  useEffect(() => {
    setEnvInfo({
      apiBaseUrl: "https://57d5-2409-8962-ace-4cf-34bf-399-87c0-cbd6.ngrok-free.app",
      wsUrl: "wss://57d5-2409-8962-ace-4cf-34bf-399-87c0-cbd6.ngrok-free.app",
      nodeEnv: process.env.NODE_ENV || "Unknown",
      browserInfo: navigator.userAgent,
      origin: window.location.origin,
    })
  }, [])

  // 添加一个测试API连接的函数
  /* const testApiConnection = async () => {
    setIsTestingApi(true)
    setApiTestResult(null)

    try {
      console.log("Testing API connection...")
      const url = `${envInfo.apiBaseUrl}/api/health?_=${Date.now()}`
      console.log(`Sending request to: ${url}`)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        mode: "cors",
        credentials: "include",
        signal: AbortSignal.timeout(5000), // 5秒超时
      })

      console.log(`Response status: ${response.status} ${response.statusText}`)

      const responseText = await response.text()
      console.log(`Response text: ${responseText}`)

      setApiTestResult(
        `连接成功! 状态: ${response.status}, 响应: ${responseText.substring(0, 100)}${responseText.length > 100 ? "..." : ""}`,
      )
    } catch (error) {
      console.error("API connection test failed:", error)
      setApiTestResult(`连接失败: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsTestingApi(false)
    }
  } */

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-gray-800 text-green-400 px-3 py-1 rounded-md font-mono text-xs"
      >
        {isVisible ? "Hide Env" : "Show Env"}
      </button>

      {isVisible && (
        <div className="mt-2 p-4 bg-gray-800 rounded-md text-green-400 font-mono text-xs max-w-md overflow-auto max-h-[80vh]">
          <div className="mb-2">
            <strong>NEXT_PUBLIC_API_BASE_URL:</strong>
            <span className="ml-2 break-all">{envInfo.apiBaseUrl}</span>
          </div>
          <div className="mb-2">
            <strong>NEXT_PUBLIC_WS_URL:</strong>
            <span className="ml-2 break-all">{envInfo.wsUrl}</span>
          </div>
          <div className="mb-2">
            <strong>NODE_ENV:</strong>
            <span className="ml-2">{envInfo.nodeEnv}</span>
          </div>
          <div className="mb-2">
            <strong>Origin:</strong>
            <span className="ml-2 break-all">{envInfo.origin}</span>
          </div>
          <div className="mb-2">
            <strong>Browser:</strong>
            <span className="ml-2 break-all">{envInfo.browserInfo}</span>
          </div>

          {/* 添加API测试按钮 */}
          <div className="mt-4 mb-2">
            <ApiTestButton />
          </div>

          {/* {apiTestResult && (
            <div
              className={`mt-2 p-2 rounded-md ${apiTestResult.includes("失败") ? "bg-red-900 text-white" : "bg-green-900 text-white"}`}
            >
              {apiTestResult}
            </div>
          )} */}

          <div className="mt-4 pt-2 border-t border-gray-700">
            <p className="text-xs text-gray-400 mb-2">How to solve API connection issues:</p>
            <ul className="text-xs text-gray-400 list-disc pl-4 space-y-1">
              <li>Make sure the API server is running</li>
              <li>Check if the API URL is correct</li>
              <li>Ensure the API server allows CORS requests from {envInfo.origin}</li>
              <li>Check network connection and firewall settings</li>
              <li>Verify that the ngrok tunnel is still active</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

