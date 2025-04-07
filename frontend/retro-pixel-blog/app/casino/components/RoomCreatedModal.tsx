"use client"

import { Button } from "@/components/ui/button"
import { Copy, Check, Share2 } from "lucide-react"
import { useState } from "react"
import GlitchEffect from "../../components/GlitchEffect"

interface RoomCreatedModalProps {
  roomId: string
  roomName: string
  onJoin: () => void
  onClose: () => void
}

export default function RoomCreatedModal({ roomId, roomName, onJoin, onClose }: RoomCreatedModalProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const shareRoom = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `Join my poker room: ${roomName}`,
          text: `Use this room ID to join my poker room: ${roomId}`,
        })
        .catch((err) => console.error("Share failed:", err))
    } else {
      copyToClipboard()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-8 rounded-lg casino-border max-w-md w-full">
        <h3 className="text-lg font-squares mb-6 text-center text-purple-300" style={{ fontSize: "0.55rem" }}>
          Room Created Successfully!
        </h3>

        <p className="font-elvpixels03 text-center mb-6" style={{ fontSize: "0.4rem" }}>
          Share this room ID with your friends to let them join your game:
        </p>

        <div className="flex items-center justify-center gap-2 mb-8">
          <div
            className="bg-gray-700 px-4 py-2 rounded-lg font-squares text-purple-300 text-center"
            style={{ fontSize: "0.6rem", letterSpacing: "0.2em" }}
          >
            {roomId}
          </div>
          <GlitchEffect triggerOnHover={true}>
            <Button onClick={copyToClipboard} size="sm" variant="outline" className="p-2">
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </Button>
          </GlitchEffect>
        </div>

        <div className="flex flex-col gap-4">
          <GlitchEffect triggerOnHover={true}>
            <Button
              onClick={shareRoom}
              className="w-full font-squares text-xs flex items-center justify-center gap-2"
              style={{ fontSize: "0.4rem" }}
            >
              <Share2 className="w-4 h-4" />
              Share Room ID
            </Button>
          </GlitchEffect>

          <GlitchEffect triggerOnHover={true}>
            <Button
              onClick={onJoin}
              className="w-full font-squares text-xs bg-purple-900 hover:bg-purple-800"
              style={{ fontSize: "0.4rem" }}
            >
              Enter Room
            </Button>
          </GlitchEffect>

          <GlitchEffect triggerOnHover={true}>
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full font-squares text-xs"
              style={{ fontSize: "0.4rem" }}
            >
              Back to Room List
            </Button>
          </GlitchEffect>
        </div>
      </div>
    </div>
  )
}

