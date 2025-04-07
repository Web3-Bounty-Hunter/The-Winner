"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface TokenRewardAnimationProps {
  amount: number
  onComplete: () => void
}

const TokenRewardAnimation: React.FC<TokenRewardAnimationProps> = ({ amount, onComplete }) => {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; delay: number }[]>([])

  useEffect(() => {
    // Create particles based on reward amount (1 particle per token, max 10)
    const particleCount = Math.min(amount, 10)
    const newParticles = Array.from({ length: particleCount }).map((_, i) => ({
      id: i,
      x: Math.random() * 200 - 100, // Random x position
      y: Math.random() * 100 - 150, // Start above
      delay: i * 0.1, // Stagger the animation
    }))

    setParticles(newParticles)

    // Call onComplete after animation finishes
    const timer = setTimeout(() => {
      onComplete()
    }, 2000)

    return () => clearTimeout(timer)
  }, [amount, onComplete])

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-6 h-6 bg-yellow-400 pixelated-border"
          initial={{
            x: particle.x,
            y: particle.y,
            opacity: 1,
            scale: 1,
          }}
          animate={{
            x: window.innerWidth - 100, // Move to token counter position
            y: -window.innerHeight / 2 + 50,
            opacity: [1, 1, 0],
            scale: [1, 1.2, 0.8],
          }}
          transition={{
            duration: 1.5,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        >
          <div className="w-full h-full flex items-center justify-center font-pixel text-black text-xs">+1</div>
        </motion.div>
      ))}
    </div>
  )
}

export default TokenRewardAnimation

