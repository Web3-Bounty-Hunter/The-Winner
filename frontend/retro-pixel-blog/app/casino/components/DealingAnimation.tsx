"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface DealingAnimationProps {
  isDealing: boolean
  playerCount: number
  onComplete: () => void
  cards: Card[]
}

const DealingAnimation: React.FC<DealingAnimationProps> = ({
  isDealing,
  playerCount,
  onComplete,
  cards
}) => {
  const dealingCompleteRef = useRef(false)

  useEffect(() => {
    if (isDealing) {
      const container = document.createElement('div')
      container.className = 'dealing-animation-container'
      document.body.appendChild(container)

      cards.forEach((card, index) => {
        const cardElement = document.createElement('div')
        cardElement.className = `dealing-card ${card.type}-card`
        container.appendChild(cardElement)

        setTimeout(() => {
          cardElement.style.transition = 'all 0.5s ease'
          const destination = getCardDestination(index, playerCount)
          cardElement.style.transform = `translate(${destination.x}px, ${destination.y}px)`
          
          setTimeout(() => cardElement.remove(), 500)
        }, index * 200)
      })

      setTimeout(() => {
        container.remove()
        onComplete()
      }, cards.length * 200 + 500)
    }
  }, [isDealing, playerCount, cards, onComplete])

  if (!isDealing) return null

  // 计算需要发的牌数量 (每个玩家2张 + 5张公共牌)
  const totalCards = playerCount * 2 + 5

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <AnimatePresence>
        {isDealing && (
          <>
            {/* 牌堆 */}
            <motion.div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-16 h-24 bg-purple-900 rounded-lg border-2 border-white pixelated-border shadow-lg">
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-squares text-white text-xs">DECK</span>
                </div>
              </div>
            </motion.div>

            {/* 发牌动画 */}
            {Array.from({ length: totalCards }).map((_, index) => (
              <motion.div
                key={`card-${index}`}
                className="absolute top-1/2 left-1/2 w-14 h-20 bg-purple-800 rounded-lg border border-white pixelated-border shadow-lg"
                initial={{
                  x: 0,
                  y: 0,
                  opacity: 1,
                  rotateZ: 0,
                  scale: 1,
                }}
                animate={{
                  x: getCardDestination(index, playerCount).x,
                  y: getCardDestination(index, playerCount).y,
                  opacity: 0.8,
                  rotateZ: Math.random() * 10 - 5,
                  scale: 0.9,
                }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                  type: "spring",
                  damping: 15,
                }}
                exit={{ opacity: 0 }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// 计算每张牌的目标位置
const getCardDestination = (cardIndex: number, playerCount: number) => {
  const playerIndex = Math.floor(cardIndex / 2);
  const cardInHand = cardIndex % 2;
  const radius = 200; // 发牌半径

  // 计算玩家位置角度（第一个玩家在正下方）
  const angle = ((playerIndex * (360 / playerCount)) - 90) * (Math.PI / 180);
  
  // 根据玩家位置计算牌的位置偏移
  const offset = cardInHand === 0 ? -20 : 20;
  
  return {
    x: Math.cos(angle) * radius + (Math.cos(angle) * offset),
    y: Math.sin(angle) * radius + (Math.sin(angle) * offset)
  };
}

export default DealingAnimation

