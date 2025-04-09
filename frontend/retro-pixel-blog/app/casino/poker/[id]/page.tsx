"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/context/auth-context"
import { useSocket } from "@/app/context/socket-context"
import LoadingScreen from "@/app/components/LoadingScreen"
import PokerTable from "@/app/casino/components/PokerTable"

export default function PokerRoomPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { socketClient, isConnected } = useSocket()
  const [isLoading, setIsLoading] = useState(true)
  const [room, setRoom] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Get room ID from params
  const roomId = params.id

  // Listen for room messages
  useEffect(() => {
    if (!socketClient || !isConnected) return

    // Join room
    socketClient.emit('joinRoom', { roomId })

    // Listen for room updates
    socketClient.on('roomUpdated', (data) => {
      if (data.room) {
        setRoom(data.room)
        setIsLoading(false)
      }
    })

    // Listen for error messages
    socketClient.on('error', (data) => {
      if (data.message) {
        setError(data.message)
        setIsLoading(false)
      }
    })

    // Cleanup function
    return () => {
      socketClient.emit('leaveRoom', { roomId })
      socketClient.off('roomUpdated')
      socketClient.off('error')
    }
  }, [socketClient, isConnected, roomId])

  // Check if user is in the correct room
  useEffect(() => {
    if (!isConnected) return

    // Get current room information
    socketClient?.emit('getRoomInfo', { roomId }, (response: any) => {
      if (response.error) {
        router.push("/casino")
      } else {
        setIsLoading(false)
      }
    })
  }, [isConnected, roomId, router, socketClient])

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

