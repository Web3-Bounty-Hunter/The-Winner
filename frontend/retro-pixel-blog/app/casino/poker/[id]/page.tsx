"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/context/auth-context"
import { usePhoton } from "@/app/lib/photon-client"
import LoadingScreen from "@/app/components/LoadingScreen"
import PokerTable from "@/app/casino/components/PokerTable"

export default function PokerRoomPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { connected, messages, getCurrentRoomId } = usePhoton()
  const [isLoading, setIsLoading] = useState(true)
  const [room, setRoom] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Get room ID from params
  const roomId = params.id

  // Listen for room messages
  useEffect(() => {
    if (messages.length === 0) return

    // Handle room joined messages
    const roomJoinedMessages = messages.filter((msg) => msg.code === 7) // ROOM_JOINED code
    if (roomJoinedMessages.length > 0) {
      const latestMessage = roomJoinedMessages[roomJoinedMessages.length - 1]
      if (latestMessage.content && latestMessage.content.room) {
        setRoom(latestMessage.content.room)
        setIsLoading(false)
      }
    }

    // Handle error messages
    const errorMessages = messages.filter((msg) => msg.code === 99) // ERROR code
    if (errorMessages.length > 0) {
      const latestMessage = errorMessages[errorMessages.length - 1]
      if (latestMessage.content && latestMessage.content.message) {
        setError(latestMessage.content.message)
        setIsLoading(false)
      }
    }
  }, [messages])

  // Check if user is in the correct room
  useEffect(() => {
    if (!connected) return

    const currentRoomId = getCurrentRoomId()

    // If not in a room or in a different room, try to join this room
    if (currentRoomId !== roomId) {
      // We'll handle this in the parent component
      router.push("/casino")
    } else {
      setIsLoading(false)
    }
  }, [connected, getCurrentRoomId, roomId, router])

  if (authLoading) {
    return <LoadingScreen message="Loading..." />
  }

  if (!user) {
    router.push(`/auth?returnTo=/casino/poker/${roomId}`)
    return <LoadingScreen message="Please log in to access the poker room..." />
  }

  if (isLoading) {
    return <LoadingScreen message="Loading poker room..." />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-8 bg-red-900 rounded-lg max-w-md">
          <h2 className="text-lg font-squares mb-4 text-center" style={{ fontSize: "0.55rem" }}>
            Error
          </h2>
          <p className="font-elvpixels03 text-center mb-6" style={{ fontSize: "0.4rem" }}>
            {error}
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => router.push("/casino")}
              className="pixelated-border p-3 bg-gray-800 hover:bg-gray-700 transition-colors font-squares text-xs"
              style={{ fontSize: "0.35rem" }}
            >
              Back to Casino
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {room ? (
        <PokerTable room={room} gameId={roomId} onExit={() => router.push("/casino")} buyIn={room.buyIn || 100} />
      ) : (
        <div className="flex justify-center items-center h-screen">
          <button
            onClick={() => router.push("/casino")}
            className="pixelated-border p-3 bg-gray-800 hover:bg-gray-700 transition-colors font-squares text-xs"
            style={{ fontSize: "0.35rem" }}
          >
            Back to Casino
          </button>
        </div>
      )}
    </div>
  )
}

