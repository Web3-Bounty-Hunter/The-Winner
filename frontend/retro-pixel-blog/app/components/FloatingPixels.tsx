"use client"

import type React from "react"
import { useEffect, useState } from "react"

interface Coin {
  id: number
  x: number
  y: number
  size: number
  speed: number
  rotation: number
  rotationSpeed: number
}

const FloatingCoins: React.FC = () => {
  const [coins, setCoins] = useState<Coin[]>([])

  useEffect(() => {
    const createCoins = () => {
      const newCoins: Coin[] = []
      for (let i = 0; i < 20; i++) {
        newCoins.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: Math.random() * 6 + 8, // Larger size for coins
          speed: Math.random() * 0.5 + 0.1,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 2,
        })
      }
      setCoins(newCoins)
    }

    createCoins()

    const animateCoins = () => {
      setCoins((prevCoins) =>
        prevCoins.map((coin) => {
          // Reset position if coin goes off screen
          const newY = coin.y - coin.speed
          const newRotation = (coin.rotation + coin.rotationSpeed) % 360

          return {
            ...coin,
            y: newY < -50 ? window.innerHeight + 50 : newY,
            x: coin.x + Math.sin(coin.y * 0.01) * 0.5,
            rotation: newRotation,
          }
        }),
      )
    }

    const intervalId = setInterval(animateCoins, 50)

    return () => clearInterval(intervalId)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      {coins.map((coin) => (
        <div
          key={coin.id}
          className="absolute"
          style={{
            left: `${coin.x}px`,
            top: `${coin.y}px`,
            width: `${coin.size}px`,
            height: `${coin.size}px`,
            transform: `rotate(${coin.rotation}deg)`,
            transition: "transform 0.5s ease",
          }}
        >
          {/* Coin shape */}
          <div className="w-full h-full rounded-full bg-yellow-400 border-2 border-yellow-600 flex items-center justify-center shadow-lg">
            <div className="w-1/2 h-1/2 rounded-full bg-yellow-500 flex items-center justify-center">
              <div className="w-1/3 h-1/3 rounded-full bg-yellow-300"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default FloatingCoins

