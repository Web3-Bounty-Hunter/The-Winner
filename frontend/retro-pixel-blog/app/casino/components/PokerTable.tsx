import React, { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import SoundManager from "../utils/SoundManager"
import DealingAnimation from './DealingAnimation'

interface Player {
  id: string
  username: string
  chips: number
  isReady: boolean
  isHost: boolean
}

interface Card {
  id: number
  type: 'white' | 'blue' | 'gold' | 'red'
  revealed: boolean
  selected: boolean
  burned: boolean
  effect?: string
}

interface PokerTableProps {
  room: any
  gameId: string
  onExit: () => void
  buyIn: number
}

const PokerTable: React.FC<PokerTableProps> = ({ room, gameId, onExit, buyIn = 1000 }) => {
  const [gameStarted, setGameStarted] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [playerCards, setPlayerCards] = useState<Card[]>([])
  const [playerStacks, setPlayerStacks] = useState<{ [key: string]: number }>({})
  const [pot, setPot] = useState(0)
  const [isDealing, setIsDealing] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<{ card: Card; question: any } | null>(null)
  const [isHostState, setIsHostState] = useState(false)
  const [isReadyState, setIsReadyState] = useState(false)
  const [activePlayer, setActivePlayer] = useState('')

  // 初始化模拟玩家
  useEffect(() => {
    const mockPlayers = [
      { id: 'player1', username: '玩家1', chips: buyIn, isReady: false, isHost: true },
      { id: 'player2', username: '玩家2', chips: buyIn, isReady: true, isHost: false },
      { id: 'player3', username: '玩家3', chips: buyIn, isReady: true, isHost: false },
      { id: 'player4', username: '玩家4', chips: buyIn, isReady: true, isHost: false },
    ]
    setPlayers(mockPlayers)
    setIsHostState(true)

    // 初始化玩家筹码
    const initialStacks: { [key: string]: number } = {}
    mockPlayers.forEach(player => {
      initialStacks[player.id] = buyIn
    })
    setPlayerStacks(initialStacks)
  }, [buyIn])

  // 发牌函数
  const dealInitialCards = useCallback(() => {
    const initialCards: Card[] = [
      { id: 0, type: 'white', revealed: false, selected: false, burned: false },
      { id: 1, type: 'white', revealed: false, selected: false, burned: false },
      { id: 2, type: 'blue', revealed: false, selected: false, burned: false, effect: 'draw_card' },
      { id: 3, type: 'gold', revealed: false, selected: false, burned: false, effect: 'double_bet' },
      { id: 4, type: 'red', revealed: false, selected: false, burned: false, effect: 'all_in' }
    ]

    setPlayerCards(initialCards)
    setIsDealing(true)
    SoundManager.play('shuffle')
  }, [])

  // 处理开始游戏
  const handleStartGame = () => {
    setGameStarted(true)
    setActivePlayer(players[0].id)
    setPot(0)

    // 发初始牌
    dealInitialCards()
  }

  // 处理准备状态
  const handleReadyToggle = () => {
    const newReadyState = !isReadyState
    setIsReadyState(newReadyState)

    // 如果是房主且准备好了，自动开始游戏
    if (isHostState && newReadyState) {
      handleStartGame()
    }
  }

  // 处理卡牌点击
  const handleCardClick = useCallback((cardId: number) => {
    const card = playerCards.find(c => c.id === cardId)
    if (!card || card.revealed) return

    setCurrentQuestion({
      card,
      question: {
        question: "这是一个测试问题？",
        options: ["选项1", "选项2", "选项3", "选项4"],
        correctAnswer: 0
      }
    })
  }, [playerCards])

  // 处理答题
  const handleAnswerQuestion = useCallback((isCorrect: boolean) => {
    if (!currentQuestion) return

    if (isCorrect) {
      const card = currentQuestion.card
      setPlayerCards(prev => prev.map(c =>
        c.id === card.id ? { ...c, revealed: true } : c
      ))

      // 处理特殊效果
      switch (card.type) {
        case 'blue':
          dealInitialCards()
          toast.success('获得一张额外的牌！')
          break
        case 'gold':
          toast.success('下注翻倍！')
          break
        case 'red':
          const playerStack = playerStacks[activePlayer] || 0
          setPot(prev => prev + playerStack)
          toast.warning('触发全押效果！')
          break
      }
      SoundManager.play('correct')
      toast.success('回答正确！')
    } else {
      SoundManager.play('wrong')
      toast.error('回答错误！')
    }

    setCurrentQuestion(null)
  }, [currentQuestion, activePlayer, playerStacks, dealInitialCards])

  return (
    <div className="relative w-full h-full bg-green-900 p-4">
      {/* 玩家位置 */}
      {players.map((player, index) => (
        <div key={player.id} className={`absolute ${getPlayerPosition(index, players.length)}`}>
          <div className={`bg-gray-800 p-2 rounded-lg ${player.id === activePlayer ? 'ring-2 ring-yellow-400' : ''}`}>
            <div className="text-white">{player.username}</div>
            <div className="text-yellow-400">{playerStacks[player.id] || buyIn}</div>
            {player.isReady && <div className="text-green-400">准备就绪</div>}
          </div>
        </div>
      ))}

      {/* 中央底池 */}
      {gameStarted && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="text-white text-xl">底池: {pot}</div>
        </div>
      )}

      {/* 玩家手牌 */}
      {gameStarted && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {playerCards.map((card) => (
            <div
              key={card.id}
              className={`card ${card.type} ${card.revealed ? 'revealed' : ''}`}
              onClick={() => handleCardClick(card.id)}
            >
              {card.revealed ? (
                <div className="card-content">
                  <span className="card-type">{card.type}</span>
                  {card.effect && <span className="card-effect">{card.effect}</span>}
                </div>
              ) : (
                <div className="card-back" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* 准备按钮 */}
      {!gameStarted && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <Button
            onClick={handleReadyToggle}
            className={isReadyState ? 'bg-green-600' : 'bg-blue-600'}
          >
            {isReadyState ? '取消准备' : '准备'}
          </Button>
        </div>
      )}

      {/* 发牌动画 */}
      <DealingAnimation
        isDealing={isDealing}
        playerCount={players.length}
        onComplete={() => {
          setIsDealing(false)
        }}
        cards={playerCards}
      />

      {/* 问题模态框 */}
      {currentQuestion && (
        <QuestionModal
          question={currentQuestion.question}
          onAnswer={handleAnswerQuestion}
          cardType={currentQuestion.card.type}
        />
      )}
    </div>
  )
}

// 获取玩家位置
const getPlayerPosition = (index: number, totalPlayers: number) => {
  if (index === 0) return "bottom-8 left-1/2 transform -translate-x-1/2"
  if (totalPlayers <= 2) return "top-8 left-1/2 transform -translate-x-1/2"
  if (totalPlayers <= 4) {
    switch (index) {
      case 1: return "top-8 left-1/2 transform -translate-x-1/2"
      case 2: return "left-8 top-1/2 transform -translate-y-1/2"
      case 3: return "right-8 top-1/2 transform -translate-y-1/2"
    }
  } else {
    switch (index) {
      case 1: return "top-8 left-1/2 transform -translate-x-1/2"
      case 2: return "left-8 top-1/2 transform -translate-y-1/2"
      case 3: return "right-8 top-1/2 transform -translate-y-1/2"
      case 4: return "top-24 left-24"
      case 5: return "top-24 right-24"
    }
  }
  return "top-8 left-1/2 transform -translate-x-1/2"
}

export default PokerTable