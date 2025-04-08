"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface DealingAnimationProps {
  isDealing: boolean
  playerCount: number
  onComplete: () => void
}

const DealingAnimation: React.FC<DealingAnimationProps> = ({ isDealing, playerCount, onComplete }) => {
  const dealingCompleteRef = useRef(false)

  useEffect(() => {
    if (isDealing && !dealingCompleteRef.current) {
      // 设置动画完成后的回调
      const timer = setTimeout(() => {
        dealingCompleteRef.current = true
        onComplete()
      }, 2000) // 动画持续2秒

      return () => clearTimeout(timer)
    }

    // 重置状态，以便下次发牌
    if (!isDealing) {
      dealingCompleteRef.current = false
    }
  }, [isDealing, onComplete])

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
  // 前 playerCount*2 张牌发给玩家
  if (cardIndex < playerCount * 2) {
    const playerIndex = Math.floor(cardIndex / 2)
    const cardInHand = cardIndex % 2

    // 根据玩家位置计算牌的目标位置
    switch (playerIndex) {
      case 0: // 底部玩家 (自己)
        return {
          x: cardInHand === 0 ? -30 : 30,
          y: 200,
        }
      case 1: // 顶部玩家
        return {
          x: cardInHand === 0 ? -20 : 20,
          y: -200,
        }
      case 2: // 左侧玩家
        return {
          x: -200,
          y: cardInHand === 0 ? -20 : 20,
        }
      case 3: // 右侧玩家
        return {
          x: 200,
          y: cardInHand === 0 ? -20 : 20,
        }
      case 4: // 左上玩家
        return {
          x: -150,
          y: -150,
        }
      case 5: // 右上玩家
        return {
          x: 150,
          y: -150,
        }
      default:
        return { x: 0, y: 0 }
    }
  } else {
    // 剩下的5张是公共牌，放在中间
    const communityIndex = cardIndex - playerCount * 2
    return {
      x: (communityIndex - 2) * 50,
      y: 0,
    }
  }
}

export default DealingAnimation

