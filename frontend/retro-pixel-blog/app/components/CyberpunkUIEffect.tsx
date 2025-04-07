"use client"

import type React from "react"
import { useState, useEffect } from "react"

interface CyberpunkUIEffectProps {
  children: React.ReactNode
}

const CyberpunkUIEffect: React.FC<CyberpunkUIEffectProps> = ({ children }) => {
  const [isGlitching, setIsGlitching] = useState(false)
  const [glitchType, setGlitchType] = useState<"scanline" | "noise" | "shift" | "color">("scanline")
  const [noiseOpacity, setNoiseOpacity] = useState(0.03) // Base noise level

  // Trigger different glitch effects randomly
  useEffect(() => {
    // Random minor noise fluctuation
    const noiseInterval = setInterval(() => {
      setNoiseOpacity(0.03 + Math.random() * 0.04)
    }, 500)

    // Random major glitch effects
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        // Choose a random glitch type
        const types: ("scanline" | "noise" | "shift" | "color")[] = ["scanline", "noise", "shift", "color"]
        setGlitchType(types[Math.floor(Math.random() * types.length)])

        // Activate glitch
        setIsGlitching(true)

        // Deactivate after a short time
        setTimeout(
          () => {
            setIsGlitching(false)
          },
          150 + Math.random() * 250,
        )
      }
    }, 3000)

    return () => {
      clearInterval(noiseInterval)
      clearInterval(glitchInterval)
    }
  }, [])

  // Generate random shift value for UI displacement
  const getRandomShift = () => {
    return `${(Math.random() - 0.5) * 10}px`
  }

  return (
    <div className="relative min-h-screen">
      {/* Main content */}
      <div
        className={`relative z-10 ${isGlitching && glitchType === "shift" ? "transition-transform duration-100" : ""}`}
        style={
          isGlitching && glitchType === "shift"
            ? { transform: `translate(${getRandomShift()}, ${getRandomShift()})` }
            : {}
        }
      >
        {children}
      </div>

      {/* Permanent CRT scanlines */}
      <div className="fixed inset-0 pointer-events-none z-20 bg-scanline" style={{ opacity: 0.07 }} />

      {/* Digital noise overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-30"
        style={{
          backgroundImage:
            'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAABmJLR0QA/wD/AP+gvaeTAAAA30lEQVRoge2awQ6EIAxFX/f/f9lZNMYYBVqgDnNWJIR7aKHQlkIIIYQQQggJxKr+WNb1ByWE9MYQN1eCqt5+iIhKRFRWcroDlZDWmuKIKYCIrIjIWt1Oa1qQmxvNrTXl0jHHiHm1CeVmRER3QvnVBvNqE8rNZt5aInKKyOnufcyl4x2sNqFcyLEQQgghhBBCyJ9Re2+pFuGo6qmqpz0Xg6lXm1AuZAwiIvP8Nh4R+RhjfGzbdnDOHTnnDmvtO5vFGJP3KHVnqAT5xhhjcs4l51zKOZecc2+llC7vhRBCCCGEkH/kC99QTZw1jjJNAAAAAElFTkSuQmCC")',
          opacity: isGlitching && glitchType === "noise" ? 0.3 : noiseOpacity,
        }}
      />

      {/* Intense scanline effect during glitch */}
      {isGlitching && glitchType === "scanline" && (
        <div className="fixed inset-0 pointer-events-none z-40 bg-scanline-intense" style={{ opacity: 0.4 }} />
      )}

      {/* Color aberration effect */}
      {isGlitching && glitchType === "color" && (
        <>
          <div
            className="fixed inset-0 pointer-events-none z-50 bg-red-500 mix-blend-screen"
            style={{
              opacity: 0.15,
              transform: `translate(${getRandomShift()}, 0)`,
            }}
          />
          <div
            className="fixed inset-0 pointer-events-none z-50 bg-blue-500 mix-blend-screen"
            style={{
              opacity: 0.15,
              transform: `translate(${getRandomShift()}, 0)`,
            }}
          />
        </>
      )}

      {/* Occasional horizontal glitch line */}
      {isGlitching && (
        <div
          className="fixed left-0 right-0 h-1 bg-white pointer-events-none z-50 mix-blend-overlay"
          style={{
            top: `${Math.random() * 100}%`,
            opacity: 0.8,
          }}
        />
      )}
    </div>
  )
}

export default CyberpunkUIEffect

