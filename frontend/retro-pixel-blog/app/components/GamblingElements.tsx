"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Coins } from "lucide-react"

interface GamblingElementsProps {
  density?: "low" | "medium" | "high"
}

const GamblingElements: React.FC<GamblingElementsProps> = ({ density = "medium" }) => {
  const [elements, setElements] = useState<
    Array<{
      id: number
      type: "dice" | "card" | "chip"
      x: number
      y: number
      rotation: number
      scale: number
    }>
  >([])

  useEffect(() => {
    // Determine number of elements based on density
    const count = density === "low" ? 5 : density === "medium" ? 10 : 15

    // Create random gambling elements
    const newElements = Array.from({ length: count }).map((_, index) => ({
      id: index,
      type: ["dice", "card", "chip"][Math.floor(Math.random() * 3)] as "dice" | "card" | "chip",
      x: Math.random() * 100,
      y: Math.random() * 100,
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 0.5,
    }))

    setElements(newElements)
  }, [density])

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {elements.map((element) => (
        <div
          key={element.id}
          className="absolute opacity-10"
          style={{
            left: `${element.x}%`,
            top: `${element.y}%`,
            transform: `rotate(${element.rotation}deg) scale(${element.scale})`,
          }}
        >
          {element.type === "dice" && (
            <div className="w-16 h-16 bg-white rounded-lg pixelated-border flex items-center justify-center">
              <div className="grid grid-cols-3 grid-rows-3 gap-1 w-10 h-10">
                <div className="rounded-full bg-black"></div>
                <div className="rounded-full"></div>
                <div className="rounded-full bg-black"></div>
                <div className="rounded-full"></div>
                <div className="rounded-full bg-black"></div>
                <div className="rounded-full"></div>
                <div className="rounded-full bg-black"></div>
                <div className="rounded-full"></div>
                <div className="rounded-full bg-black"></div>
              </div>
            </div>
          )}

          {element.type === "card" && (
            <div className="w-16 h-24 bg-white rounded-lg pixelated-border flex items-center justify-center">
              <div className="text-red-500 text-2xl font-bold">A♥</div>
            </div>
          )}

          {element.type === "chip" && (
            <div className="w-16 h-16 rounded-full bg-purple-600 border-4 border-purple-800 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                <Coins className="w-6 h-6 text-yellow-300" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default GamblingElements

