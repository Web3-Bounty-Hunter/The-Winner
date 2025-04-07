"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"

interface RotatingPokerChipProps {
  size?: number
  className?: string
  bounce?: boolean
}

const RotatingPokerChip: React.FC<RotatingPokerChipProps> = ({ size = 60, className = "", bounce = false }) => {
  const [rotation, setRotation] = useState(0)
  const [scale, setScale] = useState(1)
  const animationFrameIdRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const speedRef = useRef<number>(1)

  useEffect(() => {
    // Define the animation function
    const animate = (time: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = time
      }

      const deltaTime = time - lastTimeRef.current
      lastTimeRef.current = time

      // Dynamic rotation speed that changes over time
      speedRef.current = Math.sin(time / 1000) * 0.5 + 1.5

      // Update rotation with dynamic speed
      setRotation((prev) => (prev + speedRef.current * 2) % 360)

      // Add bouncing effect if enabled
      if (bounce) {
        const newScale = 1 + Math.sin(time / 500) * 0.05
        setScale(newScale)
      }

      // Store the animation frame ID in the ref
      animationFrameIdRef.current = requestAnimationFrame(animate)
    }

    // Start the animation
    animationFrameIdRef.current = requestAnimationFrame(animate)

    // Cleanup function to cancel animation frame when component unmounts
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current)
        animationFrameIdRef.current = null
      }
    }
  }, [bounce]) // Only re-run if bounce prop changes

  return (
    <div
      className={`relative inline-block ${className}`}
      style={{
        width: size,
        height: size,
        transform: `rotate(${rotation}deg) scale(${scale})`,
        transition: "transform 0.05s linear",
      }}
    >
      <Image
        src="/images/poker-chip.png"
        alt="Poker Chip"
        width={size}
        height={size}
        className="pixelated"
        style={{
          imageRendering: "pixelated",
          objectFit: "contain",
        }}
      />
    </div>
  )
}

export default RotatingPokerChip

