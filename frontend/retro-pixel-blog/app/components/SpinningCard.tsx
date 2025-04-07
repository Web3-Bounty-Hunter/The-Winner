"use client"

import type React from "react"

import { useState, useEffect } from "react"

interface SpinningCardProps {
  size?: number
  speed?: number
  className?: string
}

const SpinningCard: React.FC<SpinningCardProps> = ({ size = 80, speed = 2, className = "" }) => {
  const [rotation, setRotation] = useState(0)
  const [scale, setScale] = useState(1)
  const [direction, setDirection] = useState(1)

  useEffect(() => {
    const rotateInterval = setInterval(() => {
      setRotation((prev) => (prev + 3) % 360)
    }, 1000 / speed)

    const scaleInterval = setInterval(() => {
      setScale((prev) => {
        if (prev >= 1) setDirection(-1)
        else if (prev <= 0.8) setDirection(1)
        return prev + 0.01 * direction
      })
    }, 50)

    return () => {
      clearInterval(rotateInterval)
      clearInterval(scaleInterval)
    }
  }, [speed, direction])

  return (
    <div
      className={`relative ${className}`}
      style={{
        width: size,
        height: size * 1.4,
        transform: `rotate(${rotation}deg) scale(${scale})`,
        transition: "transform 0.1s linear",
      }}
    >
      <div className="w-full h-full bg-white rounded-lg pixelated-border flex items-center justify-center">
        <div className="text-red-500 text-2xl font-bold">A♠</div>
      </div>
    </div>
  )
}

export default SpinningCard

