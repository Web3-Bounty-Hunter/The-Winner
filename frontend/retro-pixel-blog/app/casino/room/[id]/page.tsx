"use client"

import React, { useContext } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { SocketContext } from '@/app/providers/socket-provider'
import { useSocketRoom } from '@/app/hooks/useSocketRoom'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAuth } from '@/app/providers/auth-provider'
import { useSocket } from '@/app/providers/socket-provider'
import PokerTable from '../../components/PokerTable'
import { ArrowLeft } from 'lucide-react'

// 简化的问题模态框组件
function QuestionModal({ question, difficulty, onAnswer }) {
  const [selectedOption, setSelectedOption] = useState(null)

  // 根据难度设置不同的样式
  let headerColor = "bg-blue-600"
  if (difficulty === "easy") headerColor = "bg-green-600"
  if (difficulty === "medium") headerColor = "bg-blue-600"
  if (difficulty === "hard") headerColor = "bg-yellow-600"
  if (difficulty === "hell") headerColor = "bg-red-600"

  const handleSubmit = () => {
    if (selectedOption === null) return
    const isCorrect = selectedOption === question.correctAnswer
    onAnswer(isCorrect)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl max-w-md w-full border border-gray-700 overflow-hidden">
        <div className={`${headerColor} p-4 text-white`}>
          <h3 className="text-lg font-bold">Question ({difficulty.toUpperCase()})</h3>
        </div>
        <div className="p-6">
          <p className="text-white mb-6">{question.text}</p>
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <div
                key={index}
                className={`p-3 rounded-md cursor-pointer border ${
                  selectedOption === index
                    ? "border-blue-500 bg-blue-900/30"
                    : "border-gray-700 hover:border-gray-500"
                }`}
                onClick={() => setSelectedOption(index)}
              >
                <p className="text-white">{option}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              className={`px-4 py-2 rounded-md ${
                selectedOption === null
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
              onClick={handleSubmit}
              disabled={selectedOption === null}
            >
              Submit Answer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 简化的闪烁效果组件
function GlitchEffect({ children, triggerOnHover = false }) {
  return (
    <div className={`relative ${triggerOnHover ? "hover:text-transparent" : "text-transparent"} duration-100`}>
      <div className="absolute inset-0 text-white">{children}</div>
      <div className={`absolute inset-0 text-cyan-400 ${triggerOnHover ? "hover:animate-glitch" : "animate-glitch"}`}>
        {children}
      </div>
      <div className={`absolute inset-0 text-red-500 ${triggerOnHover ? "hover:animate-glitch-2" : "animate-glitch-2"}`}>
        {children}
      </div>
      {children}
    </div>
  )
}

// 德州扑克房间组件
export default function CyberPokerRoom({ roomId = "1" }) {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const { user } = useAuth()
  const { socketClient } = useSocket()
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [isHost, setIsHost] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'ended'>('waiting')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCardIndex, setSelectedCardIndex] = useState(null)
  const [revealedCards, setRevealedCards] = useState([false, false, false, false, false])
  const [showQuestion, setShowQuestion] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(null)

  // 使用模拟数据初始化房间
  useEffect(() => {
    const mockRoom = {
      id,
      name: 'Play Room',
      gameType: 'poker',
      host: 'player-1',
      status: 'waiting',
      maxPlayers: 6,
      players: [],
      options: {
        buyIn: 1000,
        blinds: [10, 20]
      }
    }
    
    setCurrentRoom(mockRoom)
    // 设置当前用户为房主
    setIsHost(true)
    setGameStatus('waiting')
  }, [id])

  // 模拟玩家加入/离开
  useEffect(() => {
    const interval = setInterval(() => {
      const mockPlayers = Array(Math.floor(Math.random() * 3) + 2)
        .fill(null)
        .map((_, i) => ({
          id: `player-${i + 1}`,
          username: `PLayer${i + 1}`,
          chips: 1000,
          isReady: Math.random() > 0.5,
          isHost: i === 0
        }))
      
      setPlayers(mockPlayers)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const handleLeaveRoom = useCallback(() => {
    router.push('/casino')
  }, [router])

  // 模拟加载
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // 玩家的五张牌
  const playerCards = [
    { suit: "hearts", rank: "A", color: "white", difficulty: "easy" },
    { suit: "hearts", rank: "K", color: "white", difficulty: "easy" },
    { suit: "diamonds", rank: "Q", color: "blue", difficulty: "medium" },
    { suit: "clubs", rank: "J", color: "gold", difficulty: "hard" },
    { suit: "spades", rank: "10", color: "red", difficulty: "hell" },
  ]

  // 模拟题目数据 - 全英文，按难度分类
  const questions = {
    easy: [
      {
        id: 1,
        text: "What does BTC stand for in the crypto world?",
        options: ["Bitcoin Cash", "Bitcoin", "Binary Token Coin", "Blockchain Technology Coin"],
        correctAnswer: 1,
      },
      {
        id: 2,
        text: "Which of these is NOT a cryptocurrency?",
        options: ["Ethereum", "Dogecoin", "Litecoin", "Mastercard"],
        correctAnswer: 3,
      },
    ],
    medium: [
      {
        id: 3,
        text: "What consensus mechanism did Ethereum switch to in 2022?",
        options: ["Proof of Work", "Proof of Stake", "Proof of Authority", "Proof of History"],
        correctAnswer: 1,
      },
    ],
    hard: [
      {
        id: 4,
        text: "Which of the following is a Layer 2 scaling solution for Ethereum?",
        options: ["Solana", "Cardano", "Optimism", "Avalanche"],
        correctAnswer: 2,
      },
    ],
    hell: [
      {
        id: 5,
        text: "Which cryptographic algorithm is used in Bitcoin's digital signature scheme?",
        options: ["RSA", "ECDSA", "Ed25519", "Schnorr signatures"],
        correctAnswer: 1,
      },
    ],
  }

  // 渲染卡牌背面，根据难度显示不同颜色
  const renderCardBack = (index) => {
    const difficulty = playerCards[index].difficulty
    let bgColor = "bg-purple-900 border-purple-700"
    let innerBorderColor = "border-purple-600"
    let textColor = "text-purple-300"
    let difficultyText = "?"

    // 根据难度设置不同的颜色和文本
    if (difficulty === "easy") {
      bgColor = "bg-gray-200 border-gray-300"
      innerBorderColor = "border-gray-400"
      textColor = "text-gray-700"
      difficultyText = "EASY"
    } else if (difficulty === "medium") {
      bgColor = "bg-blue-800 border-blue-600"
      innerBorderColor = "border-blue-500"
      textColor = "text-blue-300"
      difficultyText = "MED"
    } else if (difficulty === "hard") {
      bgColor = "bg-yellow-600 border-yellow-500"
      innerBorderColor = "border-yellow-400"
      textColor = "text-yellow-200"
      difficultyText = "HARD"
    } else if (difficulty === "hell") {
      bgColor = "bg-red-800 border-red-600"
      innerBorderColor = "border-red-500"
      textColor = "text-red-300"
      difficultyText = "HELL"
    }

    return (
      <div
        className={`w-16 h-24 ${bgColor} border-2 rounded-md flex items-center justify-center cursor-pointer hover:brightness-110 transition-all transform hover:scale-105`}
        onClick={() => handleCardClick(index)}
      >
        <div className={`w-12 h-20 border-2 ${innerBorderColor} rounded-sm flex items-center justify-center`}>
          <div className={`${textColor} font-bold text-xs`}>{difficultyText}</div>
        </div>
      </div>
    )
  }

  // 渲染卡牌正面
  const renderCardFront = (card, bgColor) => {
    const suitColors = {
      hearts: "text-red-500",
      diamonds: "text-red-500",
      clubs: "text-cyan-300",
      spades: "text-cyan-300",
    }

    const suitSymbols = {
      hearts: "♥",
      diamonds: "♦",
      clubs: "♣",
      spades: "♠",
    }

    // 根据传入的bgColor参数设置卡牌背景色
    let bgColorClass = "from-gray-800 to-gray-900"
    if (bgColor === "white") bgColorClass = "from-gray-100 to-gray-200"
    if (bgColor === "blue") bgColorClass = "from-blue-800 to-blue-900"
    if (bgColor === "gold") bgColorClass = "from-yellow-500 to-yellow-600"
    if (bgColor === "red") bgColorClass = "from-red-800 to-red-900"

    return (
      <div className="w-16 h-24 bg-gray-900 border-2 border-gray-600 rounded-md flex flex-col items-center justify-center relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${bgColorClass}`}></div>
        <div className="absolute top-1 left-1 flex flex-col items-center">
          <span className={`${suitColors[card.suit]} text-sm font-bold`}>{card.rank}</span>
          <span className={`${suitColors[card.suit]} text-sm`}>{suitSymbols[card.suit]}</span>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${suitColors[card.suit]} text-4xl`}>{suitSymbols[card.suit]}</span>
        </div>
      </div>
    )
  }

  // 处理卡牌点击
  const handleCardClick = (index) => {
    // 如果卡牌已经翻开，不做任何操作
    if (revealedCards[index]) return

    setSelectedCardIndex(index)

    // 根据卡牌难度选择问题
    const cardDifficulty = playerCards[index].difficulty
    const questionPool = questions[cardDifficulty]
    const randomQuestion = questionPool[Math.floor(Math.random() * questionPool.length)]

    setCurrentQuestion({
      ...randomQuestion,
      difficulty: cardDifficulty,
    })
    setShowQuestion(true)
  }

  // 处理问题回答
  const handleAnswer = (isCorrect) => {
    setShowQuestion(false)

    if (isCorrect && selectedCardIndex !== null) {
      // 创建新的数组，将选中的卡牌设置为已翻开
      const newRevealedCards = [...revealedCards]
      newRevealedCards[selectedCardIndex] = true
      setRevealedCards(newRevealedCards)
    }

    setSelectedCardIndex(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-t-cyan-500 border-r-transparent border-b-cyan-500 border-l-transparent rounded-full animate-spin"></div>
        <p className="ml-4 text-cyan-500 text-xs">Loading poker room {roomId}...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="mb-6 flex items-center">
        <div className="hover:opacity-80">
          <Link
            href="/casino"
            className="p-3 bg-gray-800 hover:bg-gray-700 transition-colors text-xs rounded-md"
          >
            <div className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back 
            </div>
          </Link>
        </div>
        <h1 className="ml-4 text-xl text-cyan-400">Poker Room #{roomId}</h1>
      </div>

      <div className="relative h-[80vh] bg-gray-900 rounded-lg border border-cyan-900 overflow-hidden">
        {/* 游戏信息 */}
        <div className="absolute top-2 left-2 right-2 flex justify-between items-center">
          <div className="bg-gray-800 rounded-md p-2 text-xs">
            <span className="text-gray-400">Stage: </span>
            <span className="text-cyan-400">FLOP</span>
          </div>
          <div className="bg-gray-800 rounded-md p-2 text-xs">
            <span className="text-gray-400">Pot: </span>
            <span className="text-yellow-400">300</span>
          </div>
          <div className="bg-gray-800 rounded-md p-2 text-xs">
            <span className="text-gray-400">Current Bet: </span>
            <span className="text-yellow-400">50</span>
          </div>
        </div>

        {/* 牌桌 */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          {/* 赌桌 */}
          <div className="w-[500px] h-[300px] rounded-[50%] bg-gradient-to-br from-green-800 to-green-900 border-8 border-brown-800 shadow-xl flex items-center justify-center relative">
            {/* 赌桌花纹 */}
            <div className="absolute inset-8 rounded-[50%] border-2 border-green-700 opacity-50"></div>

            {/* 公共牌 - 显示为背面 */}
            <div className="flex justify-center space-x-2 mb-8">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-12 h-16 bg-blue-900 border-2 border-blue-700 rounded-md flex items-center justify-center"
                >
                  <div className="w-8 h-12 border-2 border-blue-600 rounded-sm flex items-center justify-center">
                    <div className="text-blue-300 font-bold text-xs">?</div>
                  </div>
                </div>
              ))}
            </div>

            {/* 底池 */}
            <div className="absolute bottom-10 flex justify-center">
              <div className="bg-gray-800 rounded-full px-4 py-1 text-yellow-400 text-xs">Pot: 300</div>
            </div>

            {/* 筹码堆 */}
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`w-4 h-4 rounded-full bg-yellow-500 border border-yellow-600 -mt-${i}`}></div>
              ))}
            </div>
          </div>
        </div>

        {/* AI玩家 */}
        <div className="absolute inset-0">
          {/* 顶部玩家 */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-center">
            <div className="w-12 h-12 mx-auto bg-gray-700 rounded-full mb-1 overflow-hidden">
              <img src={`/placeholder.svg?height=50&width=50`} alt="Player 3" className="w-full h-full object-cover" />
            </div>
            <p className="text-cyan-300 text-xs">Player 3</p>
            <p className="text-yellow-400 text-xs">800</p>
            <div className="flex justify-center space-x-1 mt-1">
              {[1, 2].map((i) => (
                <div key={i} className="w-10 h-14 bg-blue-900 border-2 border-blue-700 rounded-md"></div>
              ))}
            </div>
          </div>

          {/* 左上玩家 */}
          <div className="absolute top-20 left-20 text-center">
            <div className="w-12 h-12 mx-auto bg-gray-700 rounded-full mb-1 overflow-hidden">
              <img src={`/placeholder.svg?height=50&width=50`} alt="Player 2" className="w-full h-full object-cover" />
            </div>
            <p className="text-cyan-300 text-xs">Player 2</p>
            <p className="text-yellow-400 text-xs">1200</p>
            <div className="flex justify-center space-x-1 mt-1">
              {[1, 2].map((i) => (
                <div key={i} className="w-10 h-14 bg-blue-900 border-2 border-blue-700 rounded-md"></div>
              ))}
            </div>
          </div>

          {/* 右上玩家 */}
          <div className="absolute top-20 right-20 text-center">
            <div className="w-12 h-12 mx-auto bg-gray-700 rounded-full mb-1 overflow-hidden">
              <img src={`/placeholder.svg?height=50&width=50`} alt="Player 4" className="w-full h-full object-cover" />
            </div>
            <p className="text-cyan-300 text-xs">Player 4</p>
            <p className="text-yellow-400 text-xs">1500</p>
            <div className="flex justify-center space-x-1 mt-1">
              {[1, 2].map((i) => (
                <div key={i} className="w-10 h-14 bg-blue-900 border-2 border-blue-700 rounded-md"></div>
              ))}
            </div>
          </div>

          {/* 左侧玩家 */}
          <div className="absolute top-1/2 left-4 transform -translate-y-1/2 text-center">
            <div className="w-12 h-12 mx-auto bg-gray-700 rounded-full mb-1 overflow-hidden">
              <img src={`/placeholder.svg?height=50&width=50`} alt="Player 6" className="w-full h-full object-cover" />
            </div>
            <p className="text-cyan-300 text-xs">Player 6</p>
            <p className="text-yellow-400 text-xs">900</p>
            <div className="flex justify-center space-x-1 mt-1">
              {[1, 2].map((i) => (
                <div key={i} className="w-10 h-14 bg-blue-900 border-2 border-blue-700 rounded-md"></div>
              ))}
            </div>
          </div>

          {/* 右侧玩家 */}
          <div className="absolute top-1/2 right-4 transform -translate-y-1/2 text-center">
            <div className="w-12 h-12 mx-auto bg-gray-700 rounded-full mb-1 overflow-hidden">
              <img src={`/placeholder.svg?height=50&width=50`} alt="Player 5" className="w-full h-full object-cover" />
            </div>
            <p className="text-cyan-300 text-xs">Player 5</p>
            <p className="text-yellow-400 text-xs">2000</p>
            <div className="flex justify-center space-x-1 mt-1">
              {[1, 2].map((i) => (
                <div key={i} className="w-10 h-14 bg-blue-900 border-2 border-blue-700 rounded-md"></div>
              ))}
            </div>
          </div>
        </div>

        {/* 玩家区域 */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-md">
          <div className="text-center p-4 rounded-lg bg-gray-800 ring-2 ring-cyan-500">
            {/* 修改玩家区域部分，显示五张牌，初始为背面 */}
            <div className="flex justify-center space-x-4 mb-2">
              {playerCards.map((card, index) =>
                revealedCards[index] ? renderCardFront(card, card.color) : renderCardBack(index)
              )}
            </div>
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-cyan-300 text-xs">You</p>
                <p className="text-yellow-400 text-xs">1000</p>
              </div>
              <div>
                <div className="bg-gray-800 rounded-full px-2 py-0.5 text-yellow-400 text-xs inline-block">Bet: 50</div>
              </div>
              <div className="flex space-x-1">
                <div className="bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center text-[10px]">D</div>
              </div>
            </div>

            {/* 玩家操作 */}
            <div className="flex flex-col space-y-2">
              <div className="flex justify-center space-x-2">
                <button className="bg-red-900 hover:bg-red-800 text-red-100 text-xs px-3 py-1 rounded-md">
                  Fold
                </button>
                <button className="bg-blue-900 hover:bg-blue-800 text-blue-100 text-xs px-3 py-1 rounded-md">
                  Call 50
                </button>
                <button className="bg-green-900 hover:bg-green-800 text-green-100 text-xs px-3 py-1 rounded-md">
                  Raise
                </button>
                <button className="bg-purple-900 hover:bg-purple-800 text-purple-100 text-xs px-3 py-1 rounded-md">
                  All In
                </button>
              </div>

              <div className="flex items-center justify-center space-x-2">
                <input type="range" min={100} max={1000} value={200} className="w-32" />
                <span className="text-yellow-400 text-xs">200</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 问题模态框 */}
      {showQuestion && currentQuestion && (
        <QuestionModal question={currentQuestion} difficulty={currentQuestion.difficulty} onAnswer={handleAnswer} />
      )}
    </div>
  )
} 