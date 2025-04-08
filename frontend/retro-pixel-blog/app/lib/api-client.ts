// API client for blockchain knowledge quiz API

// 更新API_BASE_URL和WS_URL常量
const API_BASE_URL = "http://localhost:3001"
const WS_URL = "wss://localhost:3001"

// 简化 getApiUrl 函数，确保正确添加 /api 前缀
function getApiUrl(endpoint: string): string {
  // 如果 endpoint 已经以 /api 开头，则直接使用
  if (endpoint.startsWith("/api")) {
    return `${API_BASE_URL}${endpoint}`
  }
  // 如果 endpoint 以 / 开头但不是 /api，则添加 api
  if (endpoint.startsWith("/")) {
    return `${API_BASE_URL}/api${endpoint}`
  }
  // 其他情况，添加 /api/
  return `${API_BASE_URL}/api/${endpoint}`
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

// 修改testApiConnection函数，使其不再实际发送请求
export async function testApiConnection() {
  console.log("API testing disabled")
  return { success: true, message: "API testing disabled" }
}

// 添加一个备用测试方法，使用POST请求测试API连接
export async function testApiConnectionWithPost() {
  console.log("API POST testing disabled")
  return { success: true, message: "API POST testing disabled" }
}

// Auth API
export async function register(username: string, password: string, email?: string) {
  console.log("Register function called with:", { username, email })
  console.log("Using API URL:", API_BASE_URL)

  try {
    console.log("Sending registration request...")
    const response = await fetch(getApiUrl("/auth/register"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({ username, password, email }),
      mode: "cors",
      credentials: "omit", // 统一使用 omit
    })

    console.log("Registration response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Registration error response:", errorText)

      try {
        const errorData = JSON.parse(errorText)
        throw new Error(errorData.error || "Registration failed")
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
    const response = await fetch(getApiUrl("/auth/login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({ username, password }),
      mode: "cors",
      credentials: "omit", // 统一使用 omit
    })

    console.log("Login response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Login error response:", errorText)

      try {
        const errorData = JSON.parse(errorText)
        throw new Error(errorData.error || "Login failed")
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
    const response = await fetch(getApiUrl("/auth/me"), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      mode: "cors",
      credentials: "omit", // 统一使用 omit
    })

    if (!response.ok) {
      if (response.status === 401) {
        // Token invalid, clear local storage
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
    const response = await fetch(getApiUrl("/coins/balance"), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      credentials: "omit", // 统一使用 omit
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
    const response = await fetch(getApiUrl(`/coins/transactions?limit=${limit}&offset=${offset}`), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      credentials: "omit", // 统一使用 omit
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
export async function getQuestions(topic: string, difficulty: string = 'all', count = 10) {
  console.log(`=== STARTING API REQUEST FOR QUESTIONS ===`)
  
  // 处理 difficulty 参数
  let difficulties: string[];
  if (difficulty === 'all') {
    difficulties = ['easy', 'medium', 'hard', 'hell'];
  } else {
    difficulties = [difficulty];
  }

  try {
    const promises = difficulties.map(diff => {
      const params = new URLSearchParams({
        topic: topic,
        difficulty: diff,
        count: Math.floor(count / difficulties.length).toString(),
        _: Date.now().toString(),
      });

      return fetch(`${API_BASE_URL}/api/questions?${params.toString()}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "ngrok-skip-browser-warning": "true",
        },
        mode: "cors",
        credentials: "omit",
      }).then(res => res.json());
    });

    const results = await Promise.all(promises);
    return results.flat();
  } catch (error) {
    console.error(`Failed to fetch questions:`, error);
    throw error;
  }
}

export async function getQuestionCategories() {
  try {
    const response = await fetch(getApiUrl("/questions/categories"), {
      headers: {
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      credentials: "omit", // 统一使用 omit
    })

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

export async function testRegistrationApi(username: string, password: string) {
  console.log("Testing Registration API with:", { username })
  try {
    const response = await fetch(getApiUrl("/auth/test-registration"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({ username, password }),
      mode: "cors",
      credentials: "omit", // 统一使用 omit
    })

    console.log("Registration API test response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Registration API test error response:", errorText)
      return { success: false, error: `Registration test failed with status ${response.status}: ${errorText}` }
    }

    const data = await response.json()
    console.log("Registration API test successful:", data)
    return { success: true, data }
  } catch (error) {
    console.error("Registration API test error:", error)
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred" }
  }
}

// 添加一个直接获取房间列表的API方法

// 直接通过HTTP获取房间列表（备用方法）
export async function fetchRoomsList(tableType = "all") {
  try {
    const response = await fetch(`${API_BASE_URL}/api/rooms?type=${tableType}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "ngrok-skip-browser-warning": "true",
      },
      credentials: "omit",
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.rooms || []
  } catch (error) {
    console.error("Error fetching rooms list:", error)
    return []
  }
}

// 获取单个题目
export async function getQuestion(id: number) {
  const response = await fetch(`${API_BASE_URL}/api/questions/${id}`)
  if (!response.ok) {
    throw new Error('获取题目失败')
  }
  return response.json()
}

// 获取下一题
export async function getNextQuestion(courseId: string, currentId: number) {
  const response = await fetch(`${API_BASE_URL}/api/questions/next?courseId=${courseId}&currentId=${currentId}`)
  if (!response.ok) {
    throw new Error('获取下一题失败')
  }
  return response.json()
}

// 更新用户代币
export async function updateUserTokens(questionId: number, reward: number) {
  const response = await fetch(`${API_BASE_URL}/api/user/tokens`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ questionId, reward })
  })
  if (!response.ok) {
    throw new Error('更新代币失败')
  }
  return response.json()
}

