"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import GlitchEffect from "../../components/GlitchEffect"
import { Coins } from "lucide-react"
import { toast } from "sonner"

interface CreateRoomFormProps {
  onCancel: () => void
  onSubmit: (options: {
    name: string
    maxPlayers: number
    isPrivate: boolean
    password?: string
    topic: string
    difficulty: string
  }) => void
  buyIn: number
  isLoading: boolean
}

export default function CreateRoomForm({ onCancel, onSubmit, buyIn, isLoading }: CreateRoomFormProps) {
  const [roomName, setRoomName] = useState("")
  const [maxPlayers, setMaxPlayers] = useState(4)
  const [isPrivate, setIsPrivate] = useState(false)
  const [password, setPassword] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [topic, setTopic] = useState("")
  const [difficulty, setDifficulty] = useState("")

  // Reset error when form values change
  useEffect(() => {
    if (formError) {
      setFormError(null)
    }
  }, [roomName, maxPlayers, isPrivate, password, formError])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!roomName.trim()) {
      toast.error('请输入房间名称')
      return
    }

    if (maxPlayers < 2 || maxPlayers > 6) {
      setFormError("Players must be between 2 and 6")
      return
    }

    if (isPrivate && password.trim() === "") {
      setFormError("Password is required for private rooms")
      return
    }

    // Submit form if validation passes
    const options = {
      name: roomName,
      maxPlayers: parseInt(maxPlayers),
      isPrivate,
      password: isPrivate ? password : undefined,
      debug: true,
      onRoomCreated: (data) => {
        console.log('房间创建成功:', data)
        localStorage.setItem('lastCreatedRoomId', data.roomId)
        toast.success('房间创建成功!')
        
        if (data.roomId) {
          onSubmit(options)
        }
      }
    }

    onSubmit(options)
  }

  return (
    <div className="mb-8 p-6 bg-gray-800 rounded-lg casino-border">
      <h3 className="text-xs font-squares mb-4 text-purple-300" style={{ fontSize: "0.45rem" }}>
        Create New Room
      </h3>

      {formError && (
        <div className="mb-4 p-2 bg-red-900 rounded-lg">
          <p className="font-elvpixels03 text-center text-white" style={{ fontSize: "0.4rem" }}>
            {formError}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-squares text-xs mb-1" style={{ fontSize: "0.4rem" }}>
            Room Name*
          </label>
          <Input
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Enter room name"
            className="font-elvpixels03"
            style={{ fontSize: "0.4rem" }}
            disabled={isLoading}
            required
          />
        </div>

        <div>
          <label className="block font-squares text-xs mb-1" style={{ fontSize: "0.4rem" }}>
            Max Players (2-6)
          </label>
          <Input
            type="number"
            min={2}
            max={6}
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
            className="font-elvpixels03"
            style={{ fontSize: "0.4rem" }}
            disabled={isLoading}
            required
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="font-squares text-xs" style={{ fontSize: "0.4rem" }}>
            Private Room
          </label>
          <Switch checked={isPrivate} onCheckedChange={setIsPrivate} disabled={isLoading} />
        </div>

        {isPrivate && (
          <div>
            <label className="block font-squares text-xs mb-1" style={{ fontSize: "0.4rem" }}>
              Room Password*
            </label>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Set password for private room"
              className="font-elvpixels03"
              style={{ fontSize: "0.4rem" }}
              disabled={isLoading}
              required={isPrivate}
            />
          </div>
        )}

        <div className="flex justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="font-squares text-yellow-400" style={{ fontSize: "0.35rem" }}>
              Buy-in: {buyIn}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <GlitchEffect triggerOnHover={true}>
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              className="font-squares text-xs"
              style={{ fontSize: "0.35rem" }}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </GlitchEffect>

          <GlitchEffect triggerOnHover={true}>
            <Button type="submit" className="font-squares text-xs" style={{ fontSize: "0.35rem" }} disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Room"}
            </Button>
          </GlitchEffect>
        </div>
      </form>
    </div>
  )
}

