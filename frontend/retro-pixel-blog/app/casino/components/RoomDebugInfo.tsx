"use client"

import type React from "react"

interface RoomDebugInfoProps {
  roomInfo: any // Replace 'any' with a more specific type if available
  players: any[] // Replace 'any[]' with a more specific type if available
  connectionStatus: string
  user: any
}

const RoomDebugInfo: React.FC<RoomDebugInfoProps> = ({ roomInfo, players, connectionStatus, user }) => {
  return (
    <div className="mt-8 p-4 bg-gray-700 rounded-lg casino-border">
      <h3 className="text-xs font-squares mb-4" style={{ fontSize: "0.45rem" }}>
        Room Debug Information
      </h3>
      <div className="font-elvpixels03 space-y-2" style={{ fontSize: "0.4rem" }}>
        <div>
          <strong>Connection Status:</strong> {connectionStatus}
        </div>
        <div>
          <strong>Room ID:</strong> {roomInfo?.id}
        </div>
        <div>
          <strong>Room Name:</strong> {roomInfo?.name}
        </div>
        <div>
          <strong>Host:</strong> {roomInfo?.host}
        </div>
        <div>
          <strong>User:</strong> {user?.username}
        </div>
        <div>
          <strong>Players:</strong>
          <ul>
            {players.map((player) => (
              <li key={player.id}>
                {player.username} (ID: {player.id})
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default RoomDebugInfo

