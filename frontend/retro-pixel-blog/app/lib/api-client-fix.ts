// 创建一个新的API客户端文件，完全替换旧的实现

// API client for blockchain knowledge quiz API

// 强制使用新的ngrok URL，不使用环境变量
const API_BASE_URL = "https://b4da-171-214-155-12.ngrok-free.app/api"
const WS_URL = "wss://b4da-171-214-155-12.ngrok-free.app"

// 添加一个函数来获取完整的API URL
function getApiUrl(endpoint: string): string {
  return `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`
}

// Types
export interface User {
  id: number
  username: string
  email?: string
  coins: number
  created_at?: string
  last_login?: string
}

export interface Question {
  id: number
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
  difficulty: string
  topic: string
  source?: string
}

export interface Topic {
  id: string
  name: string
  difficulties: string[]
}

export interface Transaction {
  id: number
  user_id: number
  amount: number
  type: string
  description: string
  created_at: string
}

// 修改testApiConnection函数以提供更详细的错误信息
export async function testApiConnection() {
  console.log("Testing API connection to:", API_BASE_URL)
  try {
    // 首先尝试一个简单的GET请求到根端点
    const response = await fetch(`${API_BASE_URL}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // 添加这些选项以处理CORS和凭证
      mode: "cors",
      credentials: "same-origin",
    })

    console.log("API health check response status:", response.status)

    if (response.ok) {
      const data = await response.json()
      console.log("API health check response data:", data)
      return { success: true, data }
    } else if (response.status === 401) {
      // 401意味着API正在运行，但我们没有认证
      return { success: true, message: "API is running, but authentication is required" }
    } else {
      const errorText = await response.text()
      console.error("API health check failed:", errorText)
      try {
        const errorData = JSON.parse(errorText)
        return { success: false, error: errorData }
      } catch {
        return { success: false, error: errorText }
      }
    }
  } catch (error) {
    console.error("API connection test error:", error)
    // 提供更详细的错误信息
    let errorMessage = "Unknown error"
    if (error instanceof Error) {
      errorMessage = error.message

      // 检查是否是CORS错误
      if (errorMessage.includes("CORS") || errorMessage.includes("cross-origin")) {
        errorMessage =
          "CORS error: The API server is not allowing requests from this origin. Please check CORS settings on your API server."
      }
      // 检查是否是网络错误
      else if (errorMessage.includes("Failed to fetch") || errorMessage.includes("Network")) {
        errorMessage =
          "Network error: Could not connect to the API server. Please check if the API server is running and accessible."
      }
    }

    return {
      success: false,
      error: errorMessage,
      details: error,
    }
  }
}

// Auth API
export async function register(username: string, password: string, email?: string) {
  console.log("Register function called with:", { username, email })
  console.log("Using API URL:", API_BASE_URL)

  try {
    console.log("Sending registration request...")
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password, email }),
    })

    console.log("Registration response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Registration error response:", errorText)

      try {
        const errorData = JSON.parse(errorText)
        throw new Error(errorData.message || "Registration failed")
      } catch (e) {
        if (e instanceof Error && e.message !== "Registration failed") {
          throw e
        }
        throw new Error(`Registration failed with status ${response.status}: ${errorText}`)
      }
    }

    const data = await response.json()
    console.log("Registration successful, storing user data and token")
    localStorage.setItem("token", data.token)
    localStorage.setItem("user", JSON.stringify(data.user))

    return data
  } catch (error) {
    console.error("Registration error:", error)
    throw error
  }
}

export async function login(username: string, password: string) {
  console.log("Login function called with username:", username)
  console.log("Using API URL:", API_BASE_URL)

  try {
    console.log("Sending login request...")
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })

    console.log("Login response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Login error response:", errorText)

      try {
        const errorData = JSON.parse(errorText)
        throw new Error(errorData.message || "Login failed")
      } catch (e) {
        if (e instanceof Error && e.message !== "Login failed") {
          throw e
        }
        throw new Error(`Login failed with status ${response.status}: ${errorText}`)
      }
    }

    const data = await response.json()
    console.log("Login successful, storing user data and token")
    localStorage.setItem("token", data.token)
    localStorage.setItem("user", JSON.stringify(data.user))

    return data
  } catch (error) {
    console.error("Login error:", error)
    throw error
  }
}

export async function getCurrentUser() {
  const token = localStorage.getItem("token")
  if (!token) {
    return null
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        // Token 无效，清除本地存储
        localStorage.removeItem("token")
        localStorage.removeItem("user")
      }
      return null
    }

    const data = await response.json()
    localStorage.setItem("user", JSON.stringify(data.user))
    return data.user
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export function logout() {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
}

// Coins API
export async function getCoinsBalance() {
  const token = localStorage.getItem("token")
  if (!token) {
    throw new Error("Not authenticated")
  }

  try {
    const response = await fetch(`${API_BASE_URL}/coins/balance`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to get coins balance: ${errorText}`)
    }

    const data = await response.json()
    return data.coins
  } catch (error) {
    console.error("Failed to get coins balance:", error)
    throw error
  }
}

export async function getTransactions(limit = 10, offset = 0) {
  const token = localStorage.getItem("token")
  if (!token) {
    throw new Error("Not authenticated")
  }

  try {
    const response = await fetch(`${API_BASE_URL}/coins/transactions?limit=${limit}&offset=${offset}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to get transactions: ${errorText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Failed to get transactions:", error)
    throw error
  }
}

// Questions API
export async function getQuestions(topic: string, difficulty: string, count = 10) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/questions?topic=${encodeURIComponent(topic)}&difficulty=${encodeURIComponent(difficulty)}&count=${count}`,
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to get questions: ${errorText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Failed to get questions:", error)
    throw error
  }
}

export async function getQuestionCategories() {
  try {
    const response = await fetch(`${API_BASE_URL}/questions/categories`)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to get question categories: ${errorText}`)
    }

    const data = await response.json()
    return data.topics
  } catch (error) {
    console.error("Failed to get question categories:", error)
    throw error
  }
}

// WebSocket connection
export function connectWebSocket(onMessage: (data: any) => void, onOpen?: () => void, onClose?: () => void) {
  const token = localStorage.getItem("token")
  if (!token) {
    throw new Error("Not authenticated")
  }

  console.log("Connecting to WebSocket:", WS_URL)

  const ws = new WebSocket(WS_URL)

  ws.onopen = () => {
    console.log("WebSocket connection opened")
    // 认证
    ws.send(
      JSON.stringify({
        type: "authenticate",
        token,
      }),
    )
    if (onOpen) onOpen()
  }

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      console.log("WebSocket message received:", data)
      onMessage(data)
    } catch (error) {
      console.error("Error parsing WebSocket message:", error)
    }
  }

  ws.onclose = () => {
    console.log("WebSocket connection closed")
    if (onClose) onClose()
  }

  ws.onerror = (error) => {
    console.error("WebSocket error:", error)
  }

  return {
    send: (data: any) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data))
      } else {
        console.error("WebSocket is not connected")
      }
    },
    close: () => {
      ws.close()
    },
  }
}

