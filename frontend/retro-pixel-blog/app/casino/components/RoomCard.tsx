"use client"

import type React from "react"

import { Users, Coins, Lock, Globe } from "lucide-react"
import GlitchEffect from "../../components/GlitchEffect"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface RoomCardProps {
  room: Room
  onJoin: (password?: string) => void
}

export default function RoomCard({ room, onJoin }: RoomCardProps) {
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [password, setPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Format time
  const formatTime = (dateString: string) => {
    if (!dateString) return "Unknown"
    try {
      const date = new Date(dateString)
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch (e) {
      return "Invalid date"
    }
  }

  // Handle room click with password check
  const handleRoomClick = () => {
    // If the room is private, show password modal
    if (room.isPrivate) {
      setShowPasswordModal(true)
      setPassword("")
      setPasswordError(null)
    } else {
      onJoin()
    }
  }

  // Handle password submission
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!password.trim()) {
      setPasswordError("Password is required")
      return
    }

    setShowPasswordModal(false)
    onJoin(password)
  }

  // Ensure players array exists and is an array
  const players = Array.isArray(room.players) ? room.players : []

  // Calculate player count
  const playerCount = players.length

  // Ensure maxPlayers has default value
  const maxPlayers = room.maxPlayers || 6

  // Ensure status has default value
  const status = room.status || "waiting"

  return (
    <>
      <GlitchEffect triggerOnHover={true}>
        <div
          className={`p-6 bg-gray-800 rounded-lg casino-border cursor-pointer hover:bg-gray-700 transition-colors ${
            status === "playing" ? "border-yellow-500" : ""
          }`}
          onClick={handleRoomClick}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-squares text-purple-300" style={{ fontSize: "0.45rem" }}>
                {room.name || "Unnamed Room"}
              </h3>
              {room.isPrivate && <Lock className="w-3 h-3 text-yellow-400" />}
              {!room.isPrivate && <Globe className="w-3 h-3 text-green-400" />}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-1 rounded text-xs font-squares ${
                  status === "waiting"
                    ? "bg-green-900 text-green-300"
                    : status === "playing"
                      ? "bg-yellow-900 text-yellow-300"
                      : "bg-gray-700"
                }`}
                style={{ fontSize: "0.35rem" }}
              >
                {status === "waiting" ? "Waiting" : status === "playing" ? "In Progress" : "Finished"}
              </span>
            </div>
          </div>

          <div className="mt-4 flex justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="font-elvpixels03" style={{ fontSize: "0.4rem" }}>
                  {playerCount}/{maxPlayers}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className="font-elvpixels03 text-yellow-400" style={{ fontSize: "0.4rem" }}>
                  {room.buyIn || 0}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-elvpixels03 text-gray-400" style={{ fontSize: "0.35rem" }}>
                Host: {room.host || "Unknown"}
              </span>
              <span className="font-elvpixels03 text-gray-400" style={{ fontSize: "0.35rem" }}>
                {room.createdAt ? formatTime(room.createdAt) : "Just now"}
              </span>
            </div>
          </div>

          {room.id && (
            <div className="mt-2 pt-2 border-t border-gray-700">
              <div className="flex justify-between items-center">
                <span className="font-elvpixels03 text-gray-400" style={{ fontSize: "0.35rem" }}>
                  Room ID:
                </span>
                <span className="font-squares text-purple-300" style={{ fontSize: "0.35rem", letterSpacing: "0.1em" }}>
                  {room.id}
                </span>
              </div>
            </div>
          )}

          {room.topic && (
            <div className="mt-2 flex justify-between items-center">
              <span className="font-elvpixels03 text-gray-400" style={{ fontSize: "0.35rem" }}>
                Topic:
              </span>
              <span className="font-elvpixels03 text-purple-300" style={{ fontSize: "0.35rem" }}>
                {room.topic}
              </span>
            </div>
          )}

          {room.difficulty && (
            <div className="mt-1 flex justify-between items-center">
              <span className="font-elvpixels03 text-gray-400" style={{ fontSize: "0.35rem" }}>
                Difficulty:
              </span>
              <span className="font-elvpixels03 text-purple-300" style={{ fontSize: "0.35rem" }}>
                {room.difficulty}
              </span>
            </div>
          )}
        </div>
      </GlitchEffect>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-lg casino-border max-w-md w-full">
            <h3 className="text-lg font-squares mb-4 text-center text-purple-300" style={{ fontSize: "0.55rem" }}>
              Private Room
            </h3>

            <p className="font-elvpixels03 text-center mb-4" style={{ fontSize: "0.4rem" }}>
              This room requires a password to join.
            </p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block font-squares text-xs mb-1" style={{ fontSize: "0.4rem" }}>
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setPasswordError(null)
                  }}
                  placeholder="Enter room password"
                  className="font-elvpixels03"
                  style={{ fontSize: "0.4rem" }}
                />
                {passwordError && (
                  <p className="text-red-500 font-elvpixels03 mt-1" style={{ fontSize: "0.35rem" }}>
                    {passwordError}
                  </p>
                )}
              </div>

              <div className="flex justify-between">
                <GlitchEffect triggerOnHover={true}>
                  <Button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    variant="outline"
                    className="font-squares text-xs"
                    style={{ fontSize: "0.35rem" }}
                  >
                    Cancel
                  </Button>
                </GlitchEffect>

                <GlitchEffect triggerOnHover={true}>
                  <Button
                    type="submit"
                    className="font-squares text-xs bg-purple-900 hover:bg-purple-800"
                    style={{ fontSize: "0.35rem" }}
                  >
                    Join Room
                  </Button>
                </GlitchEffect>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

