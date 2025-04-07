"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../context/auth-context"
import { connectWebSocket } from "../../lib/api-client"
import { Button } from "@/components/ui/button"
import GlitchEffect from "../GlitchEffect"
import { Users, Play, Clock, Award } from "lucide-react"

interface Player {
  id: string
  username: string
  score?: number
}

interface Question {
  id: number
  question: string
  options: string[]
  timeLimit: number
  correctAnswer?: string
  explanation?: string
}

interface GameRoomProps {
  roomId: string
  onExit: () => void
}

export default function GameRoom({ roomId, onExit }: GameRoomProps) {
  const { user } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [gameState, setGameState] = useState<"waiting" | "playing" | "finished">("waiting")
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answerResult, setAnswerResult] = useState<{ isCorrect: boolean; explanation: string } | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [questionNumber, setQuestionNumber] = useState<number>(0)
  const [totalQuestions, setTotalQuestions] = useState<number>(0)
  const [rankings, setRankings] = useState<Player[]>([])
  const [socket, setSocket] = useState<{ send: (data: any) => void; close: () => void } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Connect to WebSocket when component mounts
  useEffect(() => {
    if (!user) return

    try {
      const ws = connectWebSocket(
        handleMessage,
        () => console.log("WebSocket connected"),
        () => console.log("WebSocket disconnected"),
      )

      setSocket(ws)

      // Join the room
      ws.send({
        type: "joinRoom",
        roomId,
      })

      return () => {
        ws.close()
      }
    } catch (error) {
      console.error("WebSocket connection error:", error)
      setError("Failed to connect to game server")
    }
  }, [user, roomId])

  // Timer for questions
  useEffect(() => {
    if (!currentQuestion || gameState !== "playing") return

    if (timeLeft <= 0) {
      // Time's up, submit null answer
      handleSubmitAnswer()
      return
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [timeLeft, currentQuestion, gameState])

  // Handle incoming WebSocket messages
  const handleMessage = (data: any) => {
    console.log("Received message:", data)

    switch (data.type) {
      case "room_joined":
        setPlayers(data.players)
        break

      case "player_joined":
        setPlayers((prev) => [...prev, data.player])
        break

      case "player_left":
        setPlayers((prev) => prev.filter((p) => p.id !== data.playerId))
        break

      case "game_started":
        setGameState("playing")
        setCurrentQuestion(data.question)
        setTimeLeft(data.question.timeLimit)
        setQuestionNumber(data.questionNumber)
        setTotalQuestions(data.totalQuestions)
        setSelectedAnswer(null)
        setAnswerResult(null)
        break

      case "answer_result":
        setAnswerResult({
          isCorrect: data.isCorrect,
          explanation: data.explanation,
        })
        break

      case "player_answered":
        // Update player score in the players list
        setPlayers((prev) =>
          prev.map((p) =>
            p.id === data.playerId ? { ...p, score: (p.score || 0) + (data.isCorrect ? data.points : 0) } : p,
          ),
        )
        break

      case "next_question":
        setCurrentQuestion(data.question)
        setTimeLeft(data.question.timeLimit)
        setQuestionNumber(data.questionNumber)
        setSelectedAnswer(null)
        setAnswerResult(null)
        break

      case "game_over":
        setGameState("finished")
        setRankings(data.rankings)
        break

      case "error":
        setError(data.message)
        break
    }
  }

  // Start the game (only host can do this)
  const handleStartGame = () => {
    if (!socket) return

    socket.send({
      type: "startGame",
    })
  }

  // Submit answer to current question
  const handleSubmitAnswer = () => {
    if (!socket || !currentQuestion) return

    socket.send({
      type: "answer",
      questionId: currentQuestion.id,
      answer: selectedAnswer !== null ? currentQuestion.options[selectedAnswer] : null,
    })
  }

  // Place a bet
  const handlePlaceBet = (amount: number) => {
    if (!socket) return

    socket.send({
      type: "bet",
      amount,
    })
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-800 rounded-lg casino-border">
        <h2 className="text-xs font-squares mb-6 text-center text-red-400" style={{ fontSize: "0.5rem" }}>
          Error
        </h2>
        <p className="font-elvpixels03 text-center mb-6" style={{ fontSize: "0.4rem" }}>
          {error}
        </p>
        <div className="flex justify-center">
          <GlitchEffect triggerOnHover={true}>
            <Button onClick={onExit} className="font-squares text-xs" style={{ fontSize: "0.4rem" }}>
              Back to Lobby
            </Button>
          </GlitchEffect>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-800 rounded-lg casino-border">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xs font-squares" style={{ fontSize: "0.5rem" }}>
          Game Room: {roomId}
        </h2>
        <GlitchEffect triggerOnHover={true}>
          <Button
            onClick={onExit}
            className="pixelated-border bg-red-900 hover:bg-red-800 font-squares text-xs"
            style={{ fontSize: "0.35rem" }}
          >
            Exit Room
          </Button>
        </GlitchEffect>
      </div>

      {/* Players list */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4" />
          <h3 className="text-xs font-squares" style={{ fontSize: "0.45rem" }}>
            Players ({players.length})
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {players.map((player) => (
            <div
              key={player.id}
              className={`p-3 rounded-lg ${player.id === user?.id.toString() ? "bg-purple-900" : "bg-gray-700"}`}
            >
              <div className="font-elvpixels03" style={{ fontSize: "0.4rem" }}>
                {player.username}
              </div>
              {player.score !== undefined && (
                <div className="font-squares text-yellow-400" style={{ fontSize: "0.35rem" }}>
                  Score: {player.score}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Game state */}
      {gameState === "waiting" && (
        <div className="text-center mb-6">
          <p className="font-elvpixels03 mb-6" style={{ fontSize: "0.4rem" }}>
            Waiting for players to join...
          </p>

          <GlitchEffect triggerOnHover={true}>
            <Button onClick={handleStartGame} className="font-squares text-xs" style={{ fontSize: "0.4rem" }}>
              <Play className="w-4 h-4 mr-2" />
              Start Game
            </Button>
          </GlitchEffect>
        </div>
      )}

      {gameState === "playing" && currentQuestion && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <span className="font-squares text-xs" style={{ fontSize: "0.4rem" }}>
              Question {questionNumber} of {totalQuestions}
            </span>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span
                className={`font-squares text-xs ${timeLeft < 5 ? "text-red-400" : "text-yellow-400"}`}
                style={{ fontSize: "0.4rem" }}
              >
                {timeLeft}s
              </span>
            </div>
          </div>

          <div className="p-4 bg-gray-700 rounded-lg mb-6">
            <p className="font-elvpixels03 mb-6" style={{ fontSize: "0.4rem", lineHeight: "1.4" }}>
              {currentQuestion.question}
            </p>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <GlitchEffect key={index} triggerOnHover={true} className="block">
                  <div
                    className={`p-3 rounded cursor-pointer font-elvpixels03 transition-colors ${
                      selectedAnswer === index
                        ? "bg-purple-800 border-purple-500 border-2"
                        : "bg-gray-800 hover:bg-gray-700"
                    }`}
                    onClick={() => setSelectedAnswer(index)}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-5 h-5 text-center border border-current rounded text-xs"
                        style={{ fontSize: "0.35rem" }}
                      >
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span style={{ fontSize: "0.4rem" }}>{option}</span>
                    </div>
                  </div>
                </GlitchEffect>
              ))}
            </div>

            {!answerResult && (
              <div className="mt-6 flex justify-center">
                <GlitchEffect triggerOnHover={true}>
                  <Button onClick={handleSubmitAnswer} className="font-squares text-xs" style={{ fontSize: "0.4rem" }}>
                    Submit Answer
                  </Button>
                </GlitchEffect>
              </div>
            )}

            {answerResult && (
              <div className={`mt-6 p-4 rounded-lg ${answerResult.isCorrect ? "bg-green-900" : "bg-red-900"}`}>
                <p className="font-squares text-xs mb-2" style={{ fontSize: "0.4rem" }}>
                  {answerResult.isCorrect ? "Correct!" : "Incorrect!"}
                </p>
                <p className="font-elvpixels03" style={{ fontSize: "0.4rem", lineHeight: "1.4" }}>
                  {answerResult.explanation}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {gameState === "finished" && (
        <div>
          <h3 className="text-xs font-squares mb-6 text-center" style={{ fontSize: "0.5rem" }}>
            Game Over!
          </h3>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-yellow-400" />
              <h4 className="text-xs font-squares" style={{ fontSize: "0.45rem" }}>
                Final Rankings
              </h4>
            </div>

            <div className="space-y-3">
              {rankings.map((player, index) => (
                <div
                  key={player.id}
                  className={`p-3 rounded-lg flex justify-between items-center ${
                    index === 0
                      ? "bg-yellow-900"
                      : index === 1
                        ? "bg-gray-600"
                        : index === 2
                          ? "bg-yellow-800"
                          : "bg-gray-700"
                  } ${player.id === user?.id.toString() ? "border border-purple-500" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-squares text-xs" style={{ fontSize: "0.4rem" }}>
                      #{index + 1}
                    </span>
                    <span className="font-elvpixels03" style={{ fontSize: "0.4rem" }}>
                      {player.username}
                    </span>
                  </div>
                  <span className="font-squares text-yellow-400" style={{ fontSize: "0.4rem" }}>
                    {player.score || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <GlitchEffect triggerOnHover={true}>
              <Button onClick={onExit} className="font-squares text-xs" style={{ fontSize: "0.4rem" }}>
                Back to Lobby
              </Button>
            </GlitchEffect>
          </div>
        </div>
      )}
    </div>
  )
}

