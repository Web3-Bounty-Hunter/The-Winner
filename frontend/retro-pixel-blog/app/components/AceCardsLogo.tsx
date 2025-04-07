"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"

const AceCardsLogo: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [cards, setCards] = useState([
    { suit: "♥", value: "A", color: "text-red-500" },
    { suit: "♠", value: "A", color: "text-gray-900" },
    { suit: "♦", value: "A", color: "text-red-500" },
  ])
  const [isAnimating, setIsAnimating] = useState(false)
  const [contentVisible, setContentVisible] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 卡牌值选项
  const cardValues = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
  const suits = ["♥", "♠", "♦", "♣"]
  const colors = {
    "♥": "text-red-500",
    "♦": "text-red-500",
    "♠": "text-gray-900",
    "♣": "text-gray-900",
  }

  // 初始展开动画
  useEffect(() => {
    // 延迟一小段时间后开始展开动画
    const timer = setTimeout(() => {
      setIsExpanded(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  // 处理点击事件
  const handleClick = () => {
    if (isAnimating) return

    // Play the audio using the DOM element directly
    try {
      const audioElement = document.getElementById("card-audio") as HTMLAudioElement
      if (audioElement) {
        audioElement.currentTime = 0
        audioElement.play().catch((err) => {
          console.error("Error playing audio element:", err)
        })
      }
    } catch (error) {
      console.error("Error accessing audio element:", error)
    }

    setIsAnimating(true)

    // First, stack the cards together
    setIsExpanded(false)

    // After cards are fully stacked, hide content
    setTimeout(() => {
      setContentVisible(false)

      // After content is hidden, change suits
      setTimeout(() => {
        // Generate new random cards
        const newCards = cards.map(() => {
          const randomSuit = suits[Math.floor(Math.random() * suits.length)]
          const randomValue = cardValues[Math.floor(Math.random() * cardValues.length)]
          return {
            suit: randomSuit,
            value: randomValue,
            color: colors[randomSuit],
          }
        })

        setCards(newCards)

        // After setting new cards, show content
        setTimeout(() => {
          setContentVisible(true)

          // Then expand again
          setTimeout(() => {
            setIsExpanded(true)

            // Animation complete
            setTimeout(() => {
              setIsAnimating(false)
            }, 500)
          }, 100)
        }, 100)
      }, 100)
    }, 500)
  }

  // 获取卡片的z-index
  const getZIndex = (index) => {
    if (isExpanded) {
      // 展开状态下，索引越大的卡片z-index越高
      return index
    } else {
      // 叠放状态下，第三张卡片(索引2)的z-index最高
      return index === 2 ? 10 : 2 - index
    }
  }

  // 获取展开延迟时间 - 第一张和第三张同时展开
  const getTransitionDelay = (index) => {
    if (isExpanded) {
      // 第一张(索引0)和第三张(索引2)同时展开，第二张(索引1)稍后展开
      if (index === 0 || index === 2) {
        return "0ms" // 无延迟，立即展开
      } else {
        return "70ms" // 第二张稍后展开
      }
    } else {
      return "0ms"
    }
  }

  return (
    <div className="relative h-40 w-64 mb-6 mx-auto cursor-pointer" onClick={handleClick}>
      {/* Audio element with multiple sources for better compatibility */}
      <audio id="card-audio" preload="auto" style={{ display: "none" }}>
        <source src="/audio/to-deck-fantasy-western.mp3" type="audio/mpeg" />
        <source src="/audio/to-deck-fantasy-western.wav" type="audio/wav" />
      </audio>

      {/* 三张扑克牌以扇形排列 */}
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="absolute top-0 w-28 h-40 bg-white rounded-lg casino-border transition-all"
          style={{
            left: "50%",
            transformOrigin: "bottom center",
            transform: `translateX(-50%) rotate(${isExpanded ? (index - 1) * 30 : 0}deg) 
                       translateY(${isExpanded ? 0 : 0}px)`,
            zIndex: getZIndex(index),
            transitionDelay: getTransitionDelay(index),
            transitionDuration: "400ms",
          }}
        >
          {/* 扑克牌内容 */}
          <div className="relative w-full h-full overflow-hidden">
            {/* 左上角 */}
            <div
              className={`absolute top-2 left-2 font-squares ${cards[index].color} transition-opacity duration-200`}
              style={{
                fontSize: "0.8rem",
                letterSpacing: "0.03em",
                opacity: contentVisible ? 1 : 0,
              }}
            >
              {cards[index].value}
            </div>

            {/* 右下角 */}
            <div
              className={`absolute bottom-2 right-2 font-squares ${cards[index].color} transition-opacity duration-200`}
              style={{
                fontSize: "0.8rem",
                letterSpacing: "0.03em",
                opacity: contentVisible ? 1 : 0,
              }}
            >
              {cards[index].value}
            </div>

            {/* 中央花色 - 增大尺寸 */}
            <div
              className={`absolute inset-0 flex items-center justify-center ${cards[index].color} transition-opacity duration-200`}
              style={{
                fontSize: "46px", // 增大约30%
                lineHeight: "1",
                textShadow:
                  cards[index].color === "text-red-500"
                    ? "0 0 5px rgba(239, 68, 68, 0.5)"
                    : "0 0 5px rgba(0, 0, 0, 0.5)",
                opacity: contentVisible ? 1 : 0,
              }}
            >
              {cards[index].suit}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default AceCardsLogo

