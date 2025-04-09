"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { ArrowLeft, Coins, X, Check, Brain, Flame, MessageCircle, RefreshCw, Play } from "lucide-react"
import GlitchEffect from "../../components/GlitchEffect"
import PokerCard from "./PokerCard"
import QuestionModal from "./QuestionModal"
import { useSocket } from "../../context/socket-context"
import { useAuth } from "../../context/auth-context"
import LoadingScreen from "../../components/LoadingScreen"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import RoomDebugInfo from "./RoomDebugInfo"
import DealingAnimation from "./DealingAnimation"

interface PokerTableProps {
  room: any
  gameId: string
  onExit: () => void
  buyIn: number
}

// Card types with difficulty levels
type CardDifficulty = "easy" | "medium" | "hard" | "extreme"
type CardSuit = "hearts" | "diamonds" | "clubs" | "spades"
type CardValue = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A"

interface Card {
  id: number
  difficulty: CardDifficulty
  revealed: boolean
  suit?: CardSuit
  value?: CardValue
  selected: boolean
  burned: boolean
}

interface ChatMessage {
  id: number
  username: string
  message: string
  timestamp: Date
}

// Define Player interface
interface Player {
  id: string
  username: string
  isHost?: boolean
  isReady: boolean
  score?: number
  avatar?: string
  cards?: Card[]
}

// Define Room interface
interface Room {
  id: string
  name: string
  host: string
  maxPlayers: number
  players: Player[]
  status: string
}

// Define WSQuestion interface
interface WSQuestion {
  id: string
  text: string
  options: string[]
  correctAnswer: number
}

const PokerTable: React.FC<PokerTableProps> = ({ room: initialRoom, gameId, onExit, buyIn }) => {
  const { user } = useAuth()
  const { socketClient } = useSocket()
  const [currentRoom, setCurrentRoom] = useState(initialRoom)
  const [gameStage, setGameStage] = useState<"pre-flop" | "flop" | "turn" | "river" | "showdown">("pre-flop")
  const [playerCards, setPlayerCards] = useState<Card[]>([])
  const [communityCards, setCommunityCards] = useState<Card[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [pot, setPot] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState<{ card: Card; question: any } | null>(null)
  const [selectedCardCount, setSelectedCardCount] = useState(0)
  const [showSelectionConfirm, setShowSelectionConfirm] = useState(false)
  const [roomInfo, setRoomInfo] = useState<Room | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isHostState, setIsHostState] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isReadyState, setIsReadyState] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [chatMessage, setChatMessage] = useState("")
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const processedMessagesRef = useRef<Set<string>>(new Set())
  const lastMessageTimeRef = useRef<number>(0)
  const roomInfoRequestedRef = useRef<boolean>(false)
  const [isDealing, setIsDealing] = useState(false)
  const [dealingAnimationComplete, setDealingAnimationComplete] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [showDebug, setShowDebug] = useState(false)
  const [hasGameStarted, setGameStarted] = useState(false)

  // Remove the debug useEffect that's causing repeated console logs
  // Fix the duplicate key warning in the players mapping

  // Add useCallback to handleWebSocketMessage to prevent recreation on every render
  const handleWebSocketMessage = useCallback(
    (latestMessage: any) => {
      console.log("PokerTable - Processing message:", latestMessage.code)

      // Generate message unique ID to avoid duplicate processing
      const messageId = `${latestMessage.code}-${JSON.stringify(latestMessage.content).slice(0, 50)}`
      if (processedMessagesRef.current.has(messageId)) {
        console.log("Already processed message, skipping:", messageId)
        return
      }
      processedMessagesRef.current.add(messageId)

      // Limit the size of processed messages set to prevent memory leaks
      if (processedMessagesRef.current.size > 100) {
        // Keep only the most recent 50 message records
        processedMessagesRef.current = new Set(Array.from(processedMessagesRef.current).slice(-50))
      }

      // Clear any loading timeouts when we receive a response
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }

      switch (latestMessage.code) {
        case 'roomUpdated':
          const roomData = latestMessage.content.room
          if (roomData) {
            console.log("Setting room info:", roomData)
            setRoomInfo(roomData)

            // Ensure players is an array
            const playersList = Array.isArray(roomData.players) ? roomData.players : []
            console.log("Players from room data:", playersList)

            // Ensure player IDs are strings for correct comparison
            const normalizedPlayers = playersList.map((player) => ({
              ...player,
              id: String(player.id),
            }))

            console.log(
              "Normalized players with usernames:",
              normalizedPlayers.map((p) => ({ id: p.id, username: p.username })),
            )

            // Update players state
            setPlayers(
              normalizedPlayers.map((player) => ({
                ...player,
                username: player.username || "Unknown Player",
              })),
            )

            // Check if current user is the host
            if (user) {
              const isUserHost =
                roomData.host === user.username || roomData.host === user.id || roomData.host === user.id.toString()
              setIsHostState(isUserHost)
              console.log("Is user host?", isUserHost, "User:", user.username, "Host:", roomData.host)
            }
            setIsLoading(false)
          }
          break

        case 'playerJoined':
          console.log("Player joined:", latestMessage.content.player)
          if (latestMessage.content.player) {
            setPlayers((prev) => {
              // Check if player already exists
              const exists = prev.some((p) => p.id === latestMessage.content.player.id)
              if (exists) return prev
              return [...prev, latestMessage.content.player]
            })

            // Show notification
            toast.info(`${latestMessage.content.player.username} joined the room`)

            // Add system message to chat
            addSystemChatMessage(`${latestMessage.content.player.username} joined the room`)
          }
          break

        case 'playerLeft':
          console.log("Player left:", latestMessage.content.playerId)
          if (latestMessage.content.playerId) {
            // Get leaving player's name
            const leavingPlayer = players.find((p) => p.id === latestMessage.content.playerId)
            const playerName = leavingPlayer?.username || latestMessage.content.playerName || "A player"

            setPlayers((prev) => prev.filter((p) => p.id !== latestMessage.content.playerId))

            // Show notification
            toast.info(`${playerName} left the room`)

            // Add system message to chat
            addSystemChatMessage(`${playerName} left the room`)
          }
          break

        case 'playerReady':
          console.log("Player ready status changed:", latestMessage.content.playerId, latestMessage.content.isReady)
          setPlayers((prev) =>
            prev.map((p) =>
              p.id === latestMessage.content.playerId ? { ...p, isReady: latestMessage.content.isReady } : p,
            ),
          )

          // Find player name
          const readyPlayer = players.find((p) => p.id === latestMessage.content.playerId)
          if (readyPlayer) {
            // Add system message to chat
            addSystemChatMessage(`${readyPlayer.username} is ${latestMessage.content.isReady ? "ready" : "not ready"}`)
          }
          break

        case 'gameStarted':
          console.log("Game started:", latestMessage.content)
          setGameStage("pre-flop")
          // Initialize cards
          initializeCards(latestMessage.content.cards)

          // Show notification
          toast.success("Game started!")

          // Add system message to chat
          addSystemChatMessage("Game has started! Good luck!")
          break

        case 'question':
          handleQuestionReceived(latestMessage.content.question)
          break

        case 'answerResult':
          handleAnswerResult(latestMessage.content.correct, latestMessage.content.cardId, latestMessage.content.card)
          break

        case 'cardSelected':
          handleCardSelected(latestMessage.content.cardId, latestMessage.content.selected)
          break

        case 'flopRevealed':
          revealFlop(latestMessage.content.communityCards)
          break

        case 'turnRevealed':
          revealTurn(latestMessage.content.card)
          break

        case 'riverRevealed':
          revealRiver(latestMessage.content.card)
          break

        case 'showdown':
          handleShowdown(latestMessage.content.results)
          break

        case 'chatMessage':
          handleChatMessage(latestMessage.content)
          break

        case 'error':
          setError(latestMessage.content.message)
          setIsLoading(false)
          toast.error(latestMessage.content.message || "An error occurred")
          break
      }
    },
    [players, user],
  )

  // 监听WebSocket消息
  useEffect(() => {
    if (!socketClient) return

    // 监听房间更新
    socketClient.on('roomUpdated', (data) => {
      if (data.room) {
        setCurrentRoom(data.room)
        setPlayers(data.room.players || [])
      }
    })

    // 监听游戏开始
    socketClient.on('gameStarted', (data) => {
      setGameStage("pre-flop")
      initializeCards(data.cards)
      toast.success("游戏开始!")
      addSystemChatMessage("游戏开始! 祝你好运!")
    })

    // 监听问题
    socketClient.on('question', (data) => {
      handleQuestionReceived(data.question)
    })

    // 监听答案结果
    socketClient.on('answerResult', (data) => {
      handleAnswerResult(data.correct, data.cardId, data.card)
    })

    // 监听聊天消息
    socketClient.on('chatMessage', (data) => {
      const newMessage = {
        id: Date.now(),
        username: data.username,
        message: data.message,
        timestamp: new Date(),
      }
      setChatMessages(prev => [...prev, newMessage])
    })

    return () => {
      socketClient.off('roomUpdated')
      socketClient.off('gameStarted')
      socketClient.off('question')
      socketClient.off('answerResult')
      socketClient.off('chatMessage')
    }
  }, [socketClient])

  // 初始化游戏
  useEffect(() => {
    // Initialize cards
    const difficulties: CardDifficulty[] = ["easy", "easy", "medium", "hard", "extreme"]
    const newCards: Card[] = difficulties.map((difficulty, index) => ({
      id: index,
      difficulty,
      revealed: false,
      selected: false,
      burned: false,
    }))

    setPlayerCards(newCards)

    // Initialize community cards
    setCommunityCards([
      { id: 100, difficulty: "medium", revealed: false, selected: false, burned: false },
      { id: 101, difficulty: "medium", revealed: false, selected: false, burned: false },
      { id: 102, difficulty: "medium", revealed: false, selected: false, burned: false },
      { id: 103, difficulty: "hard", revealed: false, selected: false, burned: false },
      { id: 104, difficulty: "hard", revealed: false, selected: false, burned: false },
    ])

    // Set initial pot
    setPot(buyIn * 0.2 * 4)
  }, [buyIn])

  // 监听选中的卡牌数量
  useEffect(() => {
    const count = playerCards.filter((card) => card.selected).length
    setSelectedCardCount(count)
  }, [playerCards])

  // 聊天自动滚动到底部
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages])

  // 添加系统消息到聊天
  const addSystemChatMessage = useCallback((message: string) => {
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        username: "System",
        message: message,
        timestamp: new Date(),
      },
    ])
  }, [])

  // Handle chat message
  const handleChatMessage = useCallback(
    (message: any) => {
      if (message.username && message.message) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            username: message.username,
            message: message.message,
            timestamp: new Date(),
          },
        ])

        // 如果聊天窗口没有打开，显示通知
        if (!showChat) {
          toast.info(`${message.username}: ${message.message}`, {
            duration: 3000,
          })
        }
      }
    },
    [showChat],
  )

  // Send chat message
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault()

    if (!chatMessage.trim()) return

    socketClient?.emit('chatMessage', {
      roomId: gameId,
      message: chatMessage.trim()
    })

    // Optimistically add to local chat
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        username: user?.username || "You",
        message: chatMessage,
        timestamp: new Date(),
      },
    ])

    setChatMessage("")
  }

  // 初始化卡牌
  const initializeCards = useCallback((cards: any[]) => {
    if (!cards || cards.length === 0) return

    // 更新玩家卡牌
    setPlayerCards(
      cards.map((card, index) => ({
        id: index,
        difficulty: card.difficulty || "medium",
        revealed: false,
        selected: false,
        burned: false,
      })),
    )
  }, [])

  // 处理收到问题
  const handleQuestionReceived = useCallback(
    (question: WSQuestion) => {
      // 找到对应的卡牌
      const cardIndex = playerCards.findIndex((card) => !card.revealed && !card.burned)

      if (cardIndex === -1) return

      const card = playerCards[cardIndex]

      setCurrentQuestion({
        card,
        question: {
          id: question.id,
          text: question.text,
          options: question.options,
          correctAnswer: question.correctAnswer || 0,
        },
      })
    },
    [playerCards],
  )

  // 处理答案结果
  const handleAnswerResult = useCallback(
    (correct: boolean, cardId: number, cardData: any) => {
      if (correct) {
        // 显示卡牌
        setPlayerCards((cards) =>
          cards.map((c, index) =>
            index === cardId
              ? {
                  ...c,
                  revealed: true,
                  suit: cardData.suit,
                  value: cardData.value,
                }
              : c,
          ),
        )

        // 添加系统消息到聊天
        addSystemChatMessage("You answered correctly and revealed a card!")
      } else {
        // 烧掉卡牌
        setPlayerCards((cards) => cards.map((c, index) => (index === cardId ? { ...c, burned: true } : c)))

        // 添加系统消息到聊天
        addSystemChatMessage("You answered incorrectly and burned a card!")
      }

      setCurrentQuestion(null)
    },
    [addSystemChatMessage],
  )

  // 处理卡牌选择
  const handleCardSelected = useCallback((cardId: number, selected: boolean) => {
    setPlayerCards((cards) => cards.map((c, index) => (index === cardId ? { ...c, selected } : c)))
  }, [])

  // 显示翻牌
  const revealFlop = useCallback(
    (cards: any[]) => {
      if (!cards || cards.length < 3) return

      setCommunityCards((communityCards) =>
        communityCards.map((c, i) =>
          i < 3
            ? {
                ...c,
                revealed: true,
                suit: cards[i].suit,
                value: cards[i].value,
              }
            : c,
        ),
      )

      setGameStage("flop")

      // 添加系统消息到聊天
      addSystemChatMessage("The flop has been revealed!")
    },
    [addSystemChatMessage],
  )

  // 显示转牌
  const revealTurn = useCallback(
    (card: any) => {
      if (!card) return

      setCommunityCards((communityCards) =>
        communityCards.map((c, i) =>
          i === 3
            ? {
                ...c,
                revealed: true,
                suit: card.suit,
                value: card.value,
              }
            : c,
        ),
      )

      setGameStage("turn")

      // 添加系统消息到聊天
      addSystemChatMessage("The turn has been revealed!")
    },
    [addSystemChatMessage],
  )

  // 显示河牌
  const revealRiver = useCallback(
    (card: any) => {
      if (!card) return

      setCommunityCards((communityCards) =>
        communityCards.map((c, i) =>
          i === 4
            ? {
                ...c,
                revealed: true,
                suit: card.suit,
                value: card.value,
              }
            : c,
        ),
      )

      setGameStage("river")

      // 添加系统消息到聊天
      addSystemChatMessage("The river has been revealed!")
    },
    [addSystemChatMessage],
  )

  // 处理摊牌
  const handleShowdown = useCallback(
    (results: any) => {
      setGameStage("showdown")
      // 更新玩家分数等
      if (results && results.players) {
        setPlayers(results.players)
      }

      // 添加系统消息到聊天
      addSystemChatMessage("Showdown! Let's see who wins!")
    },
    [addSystemChatMessage],
  )

  // 处理卡牌点击
  const handleCardClick = (card: Card) => {
    if (card.revealed || card.burned) return
    socketClient?.emit('requestQuestion', { 
      roomId: gameId,
      cardId: card.id,
      difficulty: card.difficulty
    })
  }

  // 处理问题回答
  const handleAnswerQuestion = (isCorrect: boolean) => {
    if (!currentQuestion) return
    socketClient?.emit('submitAnswer', {
      roomId: gameId,
      questionId: currentQuestion.question.id,
      answer: isCorrect ? currentQuestion.question.correctAnswer : -1,
      cardId: currentQuestion.card.id
    })
    setCurrentQuestion(null)
  }

  // 处理卡牌选择
  const handleSelectCard = (card: Card) => {
    if (!card.revealed || card.burned) return
    if (selectedCardCount >= 2 && !card.selected) return

    socketClient?.emit('selectCard', {
      roomId: gameId,
      cardId: card.id,
      selected: !card.selected
    })

    setPlayerCards(cards => 
      cards.map(c => c.id === card.id ? { ...c, selected: !c.selected } : c)
    )
  }

  // 确认卡牌选择并进入下一阶段
  const confirmCardSelection = () => {
    if (selectedCardCount !== 2) return

    // 使用 Photon 发送确认选择事件
    socketClient?.emit('confirmSelection', {
      roomId: gameId,
    })

    // 本地更新
    setShowSelectionConfirm(false)
  }

  // 处理退出房间
  const handleExit = () => {
    // 尝试通过WebSocket离开房间
    socketClient?.emit('leaveRoom', { roomId: gameId })
    onExit()
  }

  // Modify the handleStartGame function to allow starting with 2+ players
  // 处理开始游戏
  const handleStartGameOld = () => {
    // 检查是否有足够的玩家
    if (players.length < 2) {
      toast.error("Need at least 2 players to start the game")
      return
    }

    // 检查是否所有非主持人玩家都已准备
    const allPlayersReady = players.every((player) => {
      // 如果是主持人自己，不需要检查准备状态
      if (player.isHost || (user && (player.id === user.id.toString() || player.username === user.username))) {
        return true
      }
      // 其他玩家必须准备好
      return player.isReady
    })

    if (!allPlayersReady) {
      toast.error("All players must be ready to start the game")
      return
    }

    // 触发发牌动画
    setIsDealing(true)

    // 不立即发送开始游戏请求，等动画完成后再发送
    // startGame(gameId)

    // 添加系统消息到聊天
    addSystemChatMessage("Host has started the game!")
  }

  // 处理准备状态
  const handleReady = () => {
    const newReadyState = !isReadyState
    setIsReadyState(newReadyState)
    socketClient?.emit('setReady', {
      roomId: gameId,
      isReady: newReadyState
    })

    // Update local player state optimistically
    if (user) {
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === user.id.toString() || p.username === user.username ? { ...p, isReady: newReadyState } : p,
        ),
      )
    }

    // 添加系统消息到聊天
    addSystemChatMessage(`You are ${newReadyState ? "ready" : "not ready"}`)
  }

  // 获取难度图标
  const getDifficultyIcon = (difficulty: CardDifficulty) => {
    switch (difficulty) {
      case "easy":
        return <Brain className="w-4 h-4 text-green-400" />
      case "medium":
        return <Brain className="w-4 h-4 text-yellow-400" />
      case "hard":
        return <Brain className="w-4 h-4 text-orange-400" />
      case "extreme":
        return <Flame className="w-4 h-4 text-red-400" />
    }
  }

  // 获取难度标签
  const getDifficultyLabel = (difficulty: CardDifficulty) => {
    switch (difficulty) {
      case "easy":
        return "Easy"
      case "medium":
        return "Medium"
      case "hard":
        return "Hard"
      case "extreme":
        return "Extreme"
    }
  }

  // Format chat timestamp
  const formatChatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // 在组件内添加一个新的函数，用于手动刷新房间信息
  const refreshRoomInfo = () => {
    console.log("手动刷新房间信息 - 仅在必要时使用以避免性能问题")

    // 使用新的getRoom方法，强制刷新
    socketClient?.emit('refreshRoomInfo', { roomId: gameId, forceRefresh: true })

    if (!socketClient) {
      toast.error("无法连接到游戏服务器，请重试")
    } else {
      toast.info("正在刷新房间信息...")
      setIsLoading(true)

      // 设置超时，如果10秒内没有收到响应，显示错误
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }

      loadingTimeoutRef.current = setTimeout(() => {
        setIsLoading(false)
        toast.error("刷新房间信息超时，请重试")
      }, 10000)
    }
  }

  // 添加一个useEffect来在组件挂载时获取房间信息，使用ref避免无限循环
  useEffect(() => {
    // 组件挂载时获取房间信息，只执行一次
    if (gameId && !roomInfoRequestedRef.current) {
      console.log("初始化时获取房间信息:", gameId)
      roomInfoRequestedRef.current = true
      socketClient?.emit('refreshRoomInfo', { roomId: gameId })

      // 设置超时，如果10秒内没有收到响应，显示错误
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }

      loadingTimeoutRef.current = setTimeout(() => {
        if (isLoading) {
          setIsLoading(false)
          toast.error("加载房间信息超时，请手动刷新")
        }
      }, 10000)
    }
  }, [gameId, socketClient])

  // Find the useEffect that refreshes room info and change the interval from 60 seconds to 120 seconds
  useEffect(() => {
    if (!gameId || !roomInfo) return

    // 移除自动刷新，只在必要时手动刷新
    console.log("房间信息已加载，不再自动刷新")

    // 不再设置自动刷新间隔
  }, [gameId, roomInfo])

  // Add a card dealing animation function
  // 卡牌发牌动画
  const dealCardAnimation = (cardElement, targetX, targetY, delay = 0) => {
    if (!cardElement) return

    // 设置初始位置（牌堆中心）
    const startX = window.innerWidth / 2
    const startY = window.innerHeight / 2

    // 设置动画
    cardElement.style.transition = "none"
    cardElement.style.transform = `translate(${startX}px, ${startY}px) rotate(0deg)`
    cardElement.style.opacity = "0"

    // 触发重排以确保初始样式应用
    cardElement.offsetHeight

    // 添加延迟
    setTimeout(() => {
      // 设置动画过渡
      cardElement.style.transition = "transform 0.5s ease, opacity 0.5s ease"
      cardElement.style.transform = `translate(${targetX}px, ${targetY}px) rotate(${Math.random() * 6 - 3}deg)`
      cardElement.style.opacity = "1"
    }, delay)
  }

  // Update room state when messages are received
  useEffect(() => {
    if (socketClient) {
      const latestMessage = {
        code: 'roomUpdated',
        content: { room: currentRoom }
      }
      handleWebSocketMessage(latestMessage)
    }
  }, [socketClient, handleWebSocketMessage])

  // Handle ready status
  const handleReadyToggle = () => {
    const newReadyState = !isReadyState
    setIsReadyState(newReadyState)
    socketClient?.emit('setReady', {
      roomId: gameId,
      isReady: newReadyState
    })
  }

  // Handle game start
  const handleStartGame = () => {
    // Check if there are at least 2 players
    if (currentRoom.players.length < 2) {
      toast.error("Need at least 2 players to start the game")
      return
    }

    // Check if all non-host players are ready
    const nonHostPlayers = currentRoom.players.filter((player) => !player.isHost)
    const allReady = nonHostPlayers.every((player) => player.isReady)

    if (!allReady) {
      toast.error("All players must be ready to start the game")
      return
    }

    socketClient?.emit('startGame', { roomId: gameId })
  }

  // Handle leaving the room
  const handleLeaveRoom = () => {
    socketClient?.emit('leaveRoom', { roomId: gameId })
    onExit()
  }

  // Handle sending chat messages
  const handleSendChatNew = (e: React.FormEvent) => {
    e.preventDefault()

    if (chatInput.trim()) {
      socketClient?.emit('chatMessage', {
        roomId: gameId,
        message: chatInput.trim()
      })
      setChatInput("")
    }
  }

  // Handle dealing animation completion
  const handleDealingComplete = () => {
    setDealingAnimationComplete(true)
  }

  // Determine if the current user is the host
  const isHost = currentRoom.players.find((p) => p.isHost)?.id === localStorage.getItem("photon_user_id")

  const isGameStarted = roomInfo?.status === "playing"

  if (isLoading) {
    return <LoadingScreen message="Loading poker room..." size="large" />
  }

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-6">
        <GlitchEffect triggerOnHover={true}>
          <button
            onClick={handleExit}
            className="pixelated-border p-4 bg-gray-800 hover:bg-gray-700 transition-colors font-squares text-xs flex items-center gap-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Exit Game
          </button>
        </GlitchEffect>

        {/* 在房间标题旁边添加刷新按钮 */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <h2 className="font-squares text-purple-300 mb-1" style={{ fontSize: "0.5rem" }}>
              {roomInfo?.name || "Poker Room"}
            </h2>
            <GlitchEffect triggerOnHover={true}>
              <button
                onClick={refreshRoomInfo}
                className="p-1 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
                title="刷新房间信息"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </GlitchEffect>
          </div>
          <div className="font-elvpixels03 text-gray-400" style={{ fontSize: "0.35rem" }}>
            Players: {players.length}/{roomInfo?.maxPlayers || 6} • Host: {roomInfo?.host || "Host"}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="pixelated-border p-4 bg-purple-900">
            <Coins className="w-5 h-5 text-yellow-400" />
            <span className="font-squares text-yellow-400" style={{ fontSize: "0.4rem" }}>
              Pot: {pot}
            </span>
          </div>

          <GlitchEffect triggerOnHover={true}>
            <button
              onClick={() => setShowChat(!showChat)}
              className={`pixelated-border p-4 ${showChat ? "bg-purple-700" : "bg-gray-800 hover:bg-gray-700"} transition-colors relative`}
            >
              <MessageCircle className="w-5 h-5" />
              {!showChat && chatMessages.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              )}
            </button>
          </GlitchEffect>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900 rounded-lg mb-6">
          <p className="font-elvpixels03 text-center" style={{ fontSize: "0.4rem" }}>
            {error}
          </p>
          <div className="flex justify-center mt-2">
            <button
              onClick={() => setError(null)}
              className="pixelated-border p-2 bg-gray-800 hover:bg-gray-700 transition-colors font-squares text-xs"
              style={{ fontSize: "0.35rem" }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {roomInfo?.status === "waiting" && (
        <div className="mb-6 p-6 bg-gray-800 rounded-lg casino-border">
          <h3 className="text-xs font-squares mb-4 text-center text-purple-300" style={{ fontSize: "0.45rem" }}>
            Waiting for Players
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {players.map((player) => (
              <div
                key={player.id}
                className={`p-3 rounded-lg ${
                  player.isHost || roomInfo?.host === player.id || roomInfo?.host === player.username
                    ? "bg-purple-900"
                    : player.isReady
                      ? "bg-green-900"
                      : "bg-gray-700"
                }`}
              >
                <div className="font-elvpixels03" style={{ fontSize: "0.4rem" }}>
                  {player.username}{" "}
                  {player.isHost || roomInfo?.host === player.id || roomInfo?.host === player.username ? "(Host)" : ""}
                </div>
                {player.isReady && (
                  <div className="font-squares text-green-400 flex items-center gap-1" style={{ fontSize: "0.35rem" }}>
                    <Check className="w-3 h-3" />
                    Ready
                  </div>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <Coins className="w-3 h-3 text-yellow-400" />
                  <span className="font-elvpixels03 text-yellow-400" style={{ fontSize: "0.35rem" }}>
                    {player.score || buyIn || 0}
                  </span>
                </div>
              </div>
            ))}

            {/* Add empty seats */}
            {Array.from({ length: Math.max(0, (roomInfo?.maxPlayers || 4) - players.length) }).map((_, index) => (
              <div key={`empty-${index}`} className="p-3 rounded-lg bg-gray-800 border border-dashed border-gray-700">
                <div className="font-elvpixels03 text-gray-500" style={{ fontSize: "0.4rem" }}>
                  Empty Seat
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-4">
            {!isHost && (
              <GlitchEffect triggerOnHover={true}>
                <Button
                  onClick={handleReadyToggle}
                  className={`pixelated-border p-4 font-squares text-xs ${
                    isReadyState ? "bg-red-900 hover:bg-red-800" : "bg-green-900 hover:bg-green-800"
                  }`}
                  style={{ fontSize: "0.4rem" }}
                >
                  {isReadyState ? "Cancel Ready" : "Ready"}
                </Button>
              </GlitchEffect>
            )}

            {isHost && (
              <GlitchEffect triggerOnHover={true}>
                <Button
                  onClick={handleStartGame}
                  disabled={players.filter((p) => !p.isHost).some((p) => !p.isReady) || players.length < 2}
                  className="pixelated-border p-4 bg-purple-900 hover:bg-purple-800 font-squares text-xs flex items-center gap-2 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
                  style={{ fontSize: "0.4rem" }}
                >
                  <Play className="w-4 h-4" />
                  Start Game
                </Button>
              </GlitchEffect>
            )}
          </div>

          {isHost && players.filter((p) => !p.isHost).some((p) => !p.isReady) && (
            <p className="text-center mt-4 font-elvpixels03 text-yellow-400" style={{ fontSize: "0.35rem" }}>
              Waiting for all players to be ready...
            </p>
          )}

          {isHost && players.length < 2 && (
            <p className="text-center mt-4 font-elvpixels03 text-yellow-400" style={{ fontSize: "0.35rem" }}>
              Need at least 2 players to start the game.
            </p>
          )}
        </div>
      )}

      {/* Poker table */}
      <div className="relative w-full h-[600px] bg-green-900 rounded-full pixelated-border mb-12 overflow-hidden">
        {/* Center pot */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          {/* Community cards */}
          <div className="flex gap-4 mb-8 justify-center">
            {communityCards.map((card, index) => (
              <div key={index}>
                <PokerCard card={card} onClick={() => {}} selectable={false} />
              </div>
            ))}
          </div>
        </div>

        {/* Players around the table */}
        {players.map((player) => (
          <div key={player.id} className={`absolute ${getPlayerPosition(players.indexOf(player), players.length)}`}>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full overflow-hidden pixelated-border mb-3">
                <img
                  src={player.avatar || "/placeholder.svg?height=50&width=50"}
                  alt={player.username}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-xs font-squares" style={{ fontSize: "0.4rem" }}>
                {player.username || "Unknown Player"} {player.isHost ? "(Host)" : ""}
              </div>
              <div className="flex items-center gap-2 text-xs mt-1">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400" style={{ fontSize: "0.35rem" }}>
                  {player.score !== undefined ? player.score : buyIn || 0}
                </span>
              </div>
              {player.isReady && roomInfo?.status === "waiting" && (
                <div className="mt-1 px-2 py-1 bg-green-900 rounded-full">
                  <span className="text-green-400 font-squares" style={{ fontSize: "0.3rem" }}>
                    Ready
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Player's hand */}
      {roomInfo?.status !== "waiting" && (
        <div className="mb-8">
          <h3 className="text-lg font-squares mb-4" style={{ fontSize: "0.55rem" }}>
            Your Cards
          </h3>
          <p className="font-squares text-xs mb-8" style={{ fontSize: "0.4rem" }}>
            {gameStage === "pre-flop"
              ? "Answer questions to reveal your cards. Select 2 cards to keep for your final hand."
              : "You have selected your final hand."}
          </p>

          <div className="flex justify-center gap-8 mb-8">
            {playerCards.map((card) => (
              <GlitchEffect key={card.id} triggerOnHover={true}>
                <div
                  className={`relative ${card.selected ? "transform -translate-y-6" : ""} transition-transform`}
                  onClick={() =>
                    gameStage === "pre-flop" ? (card.revealed ? handleSelectCard(card) : handleCardClick(card)) : null
                  }
                >
                  <PokerCard
                    card={card}
                    onClick={() => {}}
                    selectable={gameStage === "pre-flop" && card.revealed && !card.burned}
                  />

                  {/* Difficulty indicator */}
                  {!card.revealed && !card.burned && (
                    <div className="absolute top-2 left-2 bg-gray-900 rounded-full p-2 pixelated-border">
                      <div className="flex items-center gap-2">
                        {getDifficultyIcon(card.difficulty)}
                        <span className="text-xs font-squares" style={{ fontSize: "0.35rem" }}>
                          {getDifficultyLabel(card.difficulty)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </GlitchEffect>
            ))}
          </div>

          {/* Selection confirmation */}
          {gameStage === "pre-flop" && (
            <div className="flex justify-center">
              <GlitchEffect triggerOnHover={true}>
                <button
                  onClick={() => selectedCardCount === 2 && setShowSelectionConfirm(true)}
                  className={`pixelated-border p-4 font-squares text-xs flex items-center gap-3 ${
                    selectedCardCount === 2
                      ? "bg-purple-900 hover:bg-purple-800 text-purple-300"
                      : "bg-gray-700 text-gray-500 cursor-not-allowed"
                  }`}
                  disabled={selectedCardCount !== 2}
                >
                  Confirm Selection ({selectedCardCount}/2)
                </button>
              </GlitchEffect>
            </div>
          )}
        </div>
      )}

      {/* Game controls */}
      {gameStage !== "pre-flop" && roomInfo?.status === "playing" && (
        <div className="flex justify-center gap-8">
          <GlitchEffect triggerOnHover={true}>
            <button className="pixelated-border p-4 bg-red-900 hover:bg-red-800 font-squares text-xs">Fold</button>
          </GlitchEffect>
          <GlitchEffect triggerOnHover={true}>
            <button className="pixelated-border p-4 bg-blue-900 hover:bg-blue-800 font-squares text-xs">Check</button>
          </GlitchEffect>
          <GlitchEffect triggerOnHover={true}>
            <button className="pixelated-border p-4 bg-green-900 hover:bg-green-800 font-squares text-xs">Bet</button>
          </GlitchEffect>
        </div>
      )}

      {/* Chat panel */}
      {showChat && (
        <div className="fixed right-4 bottom-4 w-80 h-96 bg-gray-800 rounded-lg casino-border z-50 flex flex-col">
          <div className="flex justify-between items-center p-3 border-b border-gray-700">
            <h3 className="font-squares text-purple-300" style={{ fontSize: "0.45rem" }}>
              Room Chat
            </h3>
            <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 space-y-2">
            {chatMessages.length === 0 ? (
              <p className="text-center font-elvpixels03 text-gray-500" style={{ fontSize: "0.35rem" }}>
                No messages yet
              </p>
            ) : (
              chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.username === "System"
                      ? "items-center"
                      : msg.username === user?.username
                        ? "items-end"
                        : "items-start"
                  }`}
                >
                  {msg.username === "System" ? (
                    <div className="max-w-[90%] p-2 rounded-lg bg-gray-900 text-center">
                      <p className="font-elvpixels03 text-gray-400" style={{ fontSize: "0.35rem" }}>
                        {msg.message}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div
                        className={`max-w-[80%] p-2 rounded-lg ${
                          msg.username === user?.username ? "bg-purple-900" : "bg-gray-700"
                        }`}
                      >
                        <p className="font-elvpixels03" style={{ fontSize: "0.4rem" }}>
                          {msg.message}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="font-squares text-gray-400" style={{ fontSize: "0.3rem" }}>
                          {msg.username}
                        </span>
                        <span className="font-elvpixels03 text-gray-500" style={{ fontSize: "0.3rem" }}>
                          {formatChatTime(msg.timestamp)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendChatNew} className="p-3 border-t border-gray-700 flex gap-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message..."
              className="font-elvpixels03"
              style={{ fontSize: "0.4rem" }}
            />
            <GlitchEffect triggerOnHover={true}>
              <Button type="submit" className="font-squares" style={{ fontSize: "0.35rem" }}>
                Send
              </Button>
            </GlitchEffect>
          </form>
        </div>
      )}

      {/* Question modal */}
      {currentQuestion && (
        <QuestionModal
          question={currentQuestion.question}
          difficulty={currentQuestion.card.difficulty}
          onAnswer={handleAnswerQuestion}
        />
      )}

      {/* Selection confirmation modal */}
      {showSelectionConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-lg pixelated-border max-w-md w-full">
            <h3 className="text-xl font-squares mb-6 text-center" style={{ fontSize: "0.55rem" }}>
              Confirm Selection
            </h3>
            <p className="font-squares text-center mb-8" style={{ fontSize: "0.4rem" }}>
              You have selected 2 cards for your final hand. The remaining cards will be discarded. This action cannot
              be undone.
            </p>
            <div className="flex justify-center gap-8">
              <GlitchEffect triggerOnHover={true}>
                <button
                  onClick={() => setShowSelectionConfirm(false)}
                  className="pixelated-border p-4 bg-red-900 hover:bg-red-800 font-squares text-xs flex items-center gap-3"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </GlitchEffect>
              <GlitchEffect triggerOnHover={true}>
                <button
                  onClick={confirmCardSelection}
                  className="pixelated-border p-4 bg-green-900 hover:bg-green-800 font-squares text-xs flex items-center gap-3"
                >
                  <Check className="w-4 h-4" />
                  Confirm
                </button>
              </GlitchEffect>
            </div>
          </div>
        </div>
      )}

      {roomInfo && (
        <RoomDebugInfo roomInfo={roomInfo} players={players} connectionStatus={socketClient ? socketClient.connected : false} user={user} />
      )}

      {/* 发牌动画 */}
      <DealingAnimation
        isDealing={isDealing}
        playerCount={players.length}
        onComplete={() => {
          setIsDealing(false)
          // 动画完成后再发送开始游戏请求
          socketClient?.emit('startGame', { roomId: gameId })
        }}
      />
    </div>
  )
}

// 根据玩家数量和索引获取位置
const getPlayerPosition = (index: number, totalPlayers: number) => {
  // 默认位置（底部中央）
  if (index === 0) return "bottom-8 left-1/2 transform -translate-x-1/2"

  // 根据玩家总数分配位置
  if (totalPlayers <= 2) {
    // 2个玩家：上下
    return "top-8 left-1/2 transform -translate-x-1/2"
  } else if (totalPlayers <= 4) {
    // 3-4个玩家：上左右
    switch (index) {
      case 1:
        return "top-8 left-1/2 transform -translate-x-1/2"
      case 2:
        return "left-8 top-1/2 transform -translate-y-1/2"
      case 3:
        return "right-8 top-1/2 transform -translate-y-1/2"
    }
  } else {
    // 5-6个玩家：上左右和对角线
    switch (index) {
      case 1:
        return "top-8 left-1/2 transform -translate-x-1/2"
      case 2:
        return "left-8 top-1/2 transform -translate-y-1/2"
      case 3:
        return "right-8 top-1/2 transform -translate-y-1/2"
      case 4:
        return "top-24 left-24"
      case 5:
        return "top-24 right-24"
    }
  }

  // 默认位置
  return "top-8 left-1/2 transform -translate-x-1/2"
}

export default PokerTable

