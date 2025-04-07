"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../context/auth-context"
import Link from "next/link"
import { ArrowLeft, Plus, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import GlitchEffect from "../components/GlitchEffect"
import GameRoom from "../components/multiplayer/game-room"
import { getQuestionCategories, type Topic } from "../lib/api-client"

export default function MultiplayerPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [view, setView] = useState<"lobby" | "create" | "room">("lobby")
  const [roomId, setRoomId] = useState<string>("")
  const [joinRoomId, setJoinRoomId] = useState<string>("")
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopic, setSelectedTopic] = useState<string>("")
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("")
  const [questionCount, setQuestionCount] = useState<number>(10)
  const [timePerQuestion, setTimePerQuestion] = useState<number>(30)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    async function loadTopics() {
      try {
        const topicsData = await getQuestionCategories()
        setTopics(topicsData)
        if (topicsData.length > 0) {
          setSelectedTopic(topicsData[0].id)
          if (topicsData[0].difficulties.length > 0) {
            setSelectedDifficulty(topicsData[0].difficulties[0])
          }
        }
      } catch (error) {
        console.error("Failed to load topics:", error)
        setError("Failed to load question categories")
      }
    }

    loadTopics()
  }, [])

  const handleCreateRoom = () => {
    // In a real implementation, this would create a room via WebSocket
    // For now, we'll just generate a random room ID
    const newRoomId = Math.random().toString(36).substring(2, 8)
    setRoomId(newRoomId)
    setView("room")
  }

  const handleJoinRoom = () => {
    if (!joinRoomId) {
      setError("Please enter a room ID")
      return
    }

    setRoomId(joinRoomId)
    setView("room")
  }

  const handleExitRoom = () => {
    setView("lobby")
    setRoomId("")
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-pixel">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
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

      {error && (
        <div className="mb-6 p-4 bg-red-900 rounded-lg">
          <p className="font-elvpixels03 text-center" style={{ fontSize: "0.4rem" }}>
            {error}
          </p>
        </div>
      )}

      {view === "lobby" && (
        <div className="p-6 bg-gray-800 rounded-lg casino-border">
          <h2 className="text-xs font-squares mb-6 text-center" style={{ fontSize: "0.5rem" }}>
            Multiplayer Quiz Lobby
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <GlitchEffect triggerOnHover={true}>
              <div
                className="p-6 bg-purple-900 rounded-lg cursor-pointer hover:bg-purple-800 transition-colors"
                onClick={() => setView("create")}
              >
                <div className="flex flex-col items-center text-center">
                  <Plus className="w-8 h-8 mb-4" />
                  <h3 className="text-xs font-squares mb-2" style={{ fontSize: "0.45rem" }}>
                    Create Room
                  </h3>
                  <p className="font-elvpixels03" style={{ fontSize: "0.4rem" }}>
                    Start a new quiz room and invite friends
                  </p>
                </div>
              </div>
            </GlitchEffect>

            <div className="p-6 bg-gray-700 rounded-lg">
              <h3 className="text-xs font-squares mb-4 text-center" style={{ fontSize: "0.45rem" }}>
                Join Room
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block font-squares text-xs mb-1" style={{ fontSize: "0.4rem" }}>
                    Room ID
                  </label>
                  <Input
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value)}
                    placeholder="Enter room ID"
                    className="font-elvpixels03"
                    style={{ fontSize: "0.4rem" }}
                  />
                </div>

                <GlitchEffect triggerOnHover={true}>
                  <Button
                    onClick={handleJoinRoom}
                    className="w-full font-squares text-xs"
                    style={{ fontSize: "0.4rem" }}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Join Room
                  </Button>
                </GlitchEffect>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-700 rounded-lg">
            <h3 className="text-xs font-squares mb-4" style={{ fontSize: "0.45rem" }}>
              How to Play
            </h3>

            <ul className="font-elvpixels03 space-y-2">
              {[
                "Create a room or join an existing one",
                "Invite friends to join using the room ID",
                "Answer blockchain questions correctly to earn points",
                "The player with the most points wins!",
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="text-purple-400">•</span>
                  <span style={{ fontSize: "0.4rem" }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {view === "create" && (
        <div className="p-6 bg-gray-800 rounded-lg casino-border">
          <h2 className="text-xs font-squares mb-6 text-center" style={{ fontSize: "0.5rem" }}>
            Create Quiz Room
          </h2>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block font-squares text-xs mb-1" style={{ fontSize: "0.4rem" }}>
                Topic
              </label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full p-2 bg-gray-700 rounded font-elvpixels03"
                style={{ fontSize: "0.4rem" }}
              >
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-squares text-xs mb-1" style={{ fontSize: "0.4rem" }}>
                Difficulty
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full p-2 bg-gray-700 rounded font-elvpixels03"
                style={{ fontSize: "0.4rem" }}
              >
                {topics
                  .find((t) => t.id === selectedTopic)
                  ?.difficulties.map((diff) => (
                    <option key={diff} value={diff}>
                      {diff}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block font-squares text-xs mb-1" style={{ fontSize: "0.4rem" }}>
                Number of Questions
              </label>
              <Input
                type="number"
                min={5}
                max={20}
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="font-elvpixels03"
                style={{ fontSize: "0.4rem" }}
              />
            </div>

            <div>
              <label className="block font-squares text-xs mb-1" style={{ fontSize: "0.4rem" }}>
                Time per Question (seconds)
              </label>
              <Input
                type="number"
                min={10}
                max={60}
                value={timePerQuestion}
                onChange={(e) => setTimePerQuestion(Number(e.target.value))}
                className="font-elvpixels03"
                style={{ fontSize: "0.4rem" }}
              />
            </div>
          </div>

          <div className="flex justify-between">
            <GlitchEffect triggerOnHover={true}>
              <Button
                onClick={() => setView("lobby")}
                variant="outline"
                className="font-squares text-xs"
                style={{ fontSize: "0.4rem" }}
              >
                Back
              </Button>
            </GlitchEffect>

            <GlitchEffect triggerOnHover={true}>
              <Button onClick={handleCreateRoom} className="font-squares text-xs" style={{ fontSize: "0.4rem" }}>
                Create Room
              </Button>
            </GlitchEffect>
          </div>
        </div>
      )}

      {view === "room" && <GameRoom roomId={roomId} onExit={handleExitRoom} />}
    </div>
  )
}

