"use client"

import type React from "react"

interface CardProps {
  card: {
    revealed: boolean
    burned: boolean
    selected: boolean
    suit?: "hearts" | "diamonds" | "clubs" | "spades"
    value?: string
  }
  onClick: () => void
  selectable: boolean
}

const PokerCard: React.FC<CardProps> = ({ card, onClick, selectable }) => {
  const { revealed, burned, selected, suit, value } = card

  // Get card color based on suit
  const getCardColor = () => {
    if (!revealed) return "text-gray-400"
    if (!suit) return "text-gray-400"

    return suit === "hearts" || suit === "diamonds" ? "text-red-500" : "text-gray-900"
  }

  // Get suit symbol
  const getSuitSymbol = () => {
    if (!suit) return "?"

    switch (suit) {
      case "hearts":
        return "♥"
      case "diamonds":
        return "♦"
      case "clubs":
        return "♣"
      case "spades":
        return "♠"
    }
  }

  return (
    <div
      className={`
        w-24 h-36 rounded-lg relative cursor-pointer transition-all duration-200
        ${revealed ? "bg-white" : "bg-gray-800"} 
        ${burned ? "bg-red-900 opacity-50" : ""}
        ${selected ? "ring-4 ring-purple-500" : ""}
        ${selectable ? "hover:shadow-lg hover:scale-105" : ""}
        casino-border
      `}
      onClick={onClick}
    >
      {burned ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-red-500 font-squares text-xs" style={{ fontSize: "0.4rem" }}>
            BURNED
          </div>
        </div>
      ) : revealed ? (
        <>
          <div
            className={`absolute top-2 left-2 font-squares text-xs ${getCardColor()}`}
            style={{ fontSize: "0.5rem" }}
          >
            {value}
          </div>
          <div
            className={`absolute bottom-2 right-2 font-squares text-xs ${getCardColor()}`}
            style={{ fontSize: "0.5rem" }}
          >
            {value}
          </div>
          <div
            className={`absolute inset-0 flex items-center justify-center font-squares text-2xl ${getCardColor()}`}
            style={{ fontSize: "1.2rem" }}
          >
            {getSuitSymbol()}
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-purple-400 font-squares text-xs" style={{ fontSize: "0.5rem" }}>
            ?
          </div>
        </div>
      )}
    </div>
  )
}

export default PokerCard

