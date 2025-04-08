"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import GlitchEffect from "../../components/GlitchEffect"
import { Users } from "lucide-react"

interface JoinRoomByIdFormProps {
  onJoin: (roomId: string) => void
  isLoading: boolean
}

export default function JoinRoomByIdForm({ onJoin, isLoading }: JoinRoomByIdFormProps) {
  const [roomId, setRoomId] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (roomId.trim()) {
      onJoin(roomId)
    }
  }

  return (
    <div className="mb-8 p-6 bg-gray-800 rounded-lg casino-border">
      <h3 className="text-xs font-squares mb-4 text-purple-300" style={{ fontSize: "0.45rem" }}>
        Join by Room ID
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-squares text-xs mb-1" style={{ fontSize: "0.4rem" }}>
            Room ID
          </label>
          <Input
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter room ID"
            className="font-elvpixels03"
            style={{ fontSize: "0.4rem" }}
            disabled={isLoading}
          />
        </div>

        <GlitchEffect triggerOnHover={true}>
          <Button
            type="submit"
            disabled={!roomId.trim() || isLoading}
            className="w-full font-squares text-xs flex items-center justify-center gap-2"
            style={{ fontSize: "0.4rem" }}
          >
            {isLoading ? (
              <>Joining...</>
            ) : (
              <>
                <Users className="w-4 h-4" />
                Join Room
              </>
            )}
          </Button>
        </GlitchEffect>
      </form>
    </div>
  )
}

