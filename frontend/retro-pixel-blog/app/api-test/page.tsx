"use client"

import { useState, useEffect } from "react"
import { testApiConnection, testApiConnectionWithPost } from "../lib/api-client"
import Link from "next/link"
import { ArrowLeft, RefreshCw } from "lucide-react"
import GlitchEffect from "../components/GlitchEffect"

export default function ApiTestPage() {
  const [testResult, setTestResult] = useState<any>(null)
  const [postTestResult, setPostTestResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPostLoading, setIsPostLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [networkInfo, setNetworkInfo] = useState<{
    apiUrl: string
    wsUrl: string
    online: boolean
  }>({
    apiUrl: "https://9a96-182-150-127-68.ngrok-free.app/api",
    wsUrl: "wss://9a96-182-150-127-68.ngrok-free.app",
    online: false,
  })

  // 获取网络信息
  useEffect(() => {
    setNetworkInfo({
      apiUrl: "https://9a96-182-150-127-68.ngrok-free.app/api",
      wsUrl: "wss://9a96-182-150-127-68.ngrok-free.app",
      online: navigator.onLine,
    })
  }, [])

  const runTest = async () => {
    setIsLoading(true)
    setError(null)

    console.log("API Test: 使用的API URL是:", "https://9a96-182-150-127-68.ngrok-free.app/api")

    try {
      const result = await testApiConnection()
      setTestResult(result)

      // 如果收到HTML响应，显示更详细的错误
      if (result.htmlResponse) {
        setError("API返回了HTML而不是JSON。这可能意味着URL指向了一个网页而不是API端点。")
      }
    } catch (err) {
      console.error("API test error:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const runPostTest = async () => {
    setIsPostLoading(true)
    setError(null)

    console.log("API POST Test: 使用的API URL是:", "https://9a96-182-150-127-68.ngrok-free.app/api")

    try {
      const result = await testApiConnectionWithPost()
      setPostTestResult(result)
    } catch (err) {
      console.error("API POST test error:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsPostLoading(false)
    }
  }

  // 自动运行测试
  useEffect(() => {
    runTest()
    runPostTest()
  }, [])

  // 诊断建议
  const getDiagnosticSuggestions = () => {
    if ((testResult && testResult.success) || (postTestResult && postTestResult.success)) return null

    return (
      <div className="mt-6 p-4 bg-gray-700 rounded-lg">
        <h3 className="text-xs font-squares mb-4" style={{ fontSize: "0.45rem" }}>
          诊断建议
        </h3>
        <ul className="font-elvpixels03 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-purple-400">•</span>
            <span style={{ fontSize: "0.4rem" }}>
              确认API服务器正在运行: <code className="bg-gray-800 px-1">curl {networkInfo.apiUrl}</code>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400">•</span>
            <span style={{ fontSize: "0.4rem" }}>
              检查CORS设置: 确保API服务器允许来自 {window.location.origin} 的请求
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400">•</span>
            <span style={{ fontSize: "0.4rem" }}>检查网络连接: 您当前{networkInfo.online ? "在线" : "离线"}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400">•</span>
            <span style={{ fontSize: "0.4rem" }}>检查API URL是否正确: {networkInfo.apiUrl}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400">•</span>
            <span style={{ fontSize: "0.4rem" }}>检查ngrok隧道是否仍然活跃，ngrok免费版本的隧道会在一段时间后过期</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400">•</span>
            <span style={{ fontSize: "0.4rem" }}>确认API路径是否正确，例如是否需要在URL末尾添加"/api"</span>
          </li>
        </ul>
      </div>
    )
  }

  // 显示HTML响应预览
  const getHtmlResponsePreview = () => {
    if (!testResult || !testResult.htmlResponse) return null

    return (
      <div className="mt-6 p-4 bg-gray-700 rounded-lg">
        <h3 className="text-xs font-squares mb-4" style={{ fontSize: "0.45rem" }}>
          HTML响应预览
        </h3>
        <div className="bg-gray-900 p-3 rounded-lg overflow-auto max-h-60 text-xs">
          <pre className="whitespace-pre-wrap">{testResult.htmlResponse}</pre>
        </div>
        <p className="mt-4 font-elvpixels03 text-yellow-400" style={{ fontSize: "0.4rem" }}>
          收到HTML响应而不是JSON，这表明URL可能指向了一个网页而不是API端点。
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <GlitchEffect triggerOnHover={true}>
          <Link
            href="/"
            className="pixelated-border p-3 bg-gray-800 hover:bg-gray-700 transition-colors font-squares text-xs"
            style={{ fontSize: "0.35rem" }}
          >
            <div className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </div>
          </Link>
        </GlitchEffect>
      </div>

      <div className="p-6 bg-gray-800 rounded-lg casino-border">
        <h2 className="text-xs font-squares mb-6 text-center" style={{ fontSize: "0.5rem" }}>
          API Connection Test
        </h2>

        <div className="mb-6">
          <p className="font-elvpixels03 text-center mb-4" style={{ fontSize: "0.4rem" }}>
            Testing connection to: {networkInfo.apiUrl}
          </p>

          <div className="flex justify-center gap-4">
            <GlitchEffect triggerOnHover={true}>
              <button
                onClick={runTest}
                disabled={isLoading}
                className="pixelated-border p-3 bg-gray-700 hover:bg-gray-600 transition-colors font-squares text-xs flex items-center gap-2"
                style={{ fontSize: "0.35rem" }}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Testing GET...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Test GET
                  </>
                )}
              </button>
            </GlitchEffect>

            <GlitchEffect triggerOnHover={true}>
              <button
                onClick={runPostTest}
                disabled={isPostLoading}
                className="pixelated-border p-3 bg-gray-700 hover:bg-gray-600 transition-colors font-squares text-xs flex items-center gap-2"
                style={{ fontSize: "0.35rem" }}
              >
                {isPostLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Testing POST...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Test POST
                  </>
                )}
              </button>
            </GlitchEffect>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-900 rounded-lg mb-6">
            <p className="font-elvpixels03 text-center" style={{ fontSize: "0.4rem" }}>
              Error: {error}
            </p>
          </div>
        )}

        {/* GET测试结果 */}
        {testResult && (
          <div className="mb-6">
            <h3 className="text-xs font-squares mb-4" style={{ fontSize: "0.45rem" }}>
              GET测试结果
            </h3>
            <div className={`p-4 ${testResult.success ? "bg-green-900" : "bg-red-900"} rounded-lg`}>
              <p className="font-elvpixels03 text-center mb-2" style={{ fontSize: "0.4rem" }}>
                {testResult.success ? "GET请求成功!" : "GET请求失败!"}
              </p>

              <pre className="bg-gray-900 p-3 rounded-lg overflow-auto max-h-60 text-xs">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* POST测试结果 */}
        {postTestResult && (
          <div className="mb-6">
            <h3 className="text-xs font-squares mb-4" style={{ fontSize: "0.45rem" }}>
              POST测试结果
            </h3>
            <div className={`p-4 ${postTestResult.success ? "bg-green-900" : "bg-red-900"} rounded-lg`}>
              <p className="font-elvpixels03 text-center mb-2" style={{ fontSize: "0.4rem" }}>
                {postTestResult.success ? "POST请求成功!" : "POST请求失败!"}
              </p>

              <pre className="bg-gray-900 p-3 rounded-lg overflow-auto max-h-60 text-xs">
                {JSON.stringify(postTestResult, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* HTML响应预览 */}
        {getHtmlResponsePreview()}

        {/* 诊断建议 */}
        {getDiagnosticSuggestions()}

        {/* 网络信息 */}
        <div className="mt-6 p-4 bg-gray-700 rounded-lg">
          <h3 className="text-xs font-squares mb-4" style={{ fontSize: "0.45rem" }}>
            网络信息
          </h3>
          <div className="font-elvpixels03 space-y-2">
            <div className="flex justify-between">
              <span style={{ fontSize: "0.4rem" }}>浏览器在线状态:</span>
              <span style={{ fontSize: "0.4rem" }} className={networkInfo.online ? "text-green-400" : "text-red-400"}>
                {networkInfo.online ? "在线" : "离线"}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ fontSize: "0.4rem" }}>当前页面地址:</span>
              <span style={{ fontSize: "0.4rem" }}>{window.location.href}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ fontSize: "0.4rem" }}>API URL:</span>
              <span style={{ fontSize: "0.4rem" }}>{networkInfo.apiUrl}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ fontSize: "0.4rem" }}>WebSocket URL:</span>
              <span style={{ fontSize: "0.4rem" }}>{networkInfo.wsUrl}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

