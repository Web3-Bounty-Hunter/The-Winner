"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"

interface CyberpunkGlitchTitleProps {
  text: string
  className?: string
}

const CyberpunkGlitchTitle: React.FC<CyberpunkGlitchTitleProps> = ({ text, className = "" }) => {
  const [isGlitching, setIsGlitching] = useState(false)
  const [glitchIntensity, setGlitchIntensity] = useState(0)
  const [particles, setParticles] = useState<
    Array<{
      id: number
      x: number
      y: number
      size: number
      color: string
      velocity: { x: number; y: number }
      life: number
      maxLife: number
    }>
  >([])
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLHeadingElement>(null)

  // Cyberpunk color palette
  const colors = [
    "#ff2a6d", // Neon pink
    "#05d9e8", // Cyan
    "#d946ef", // Purple
    "#ff7f11", // Orange
    "#f6f6f6", // White
    "#01c5c4", // Teal
    "#b967ff", // Violet
  ]

  // Random glitch effect
  useEffect(() => {
    const triggerRandomGlitch = () => {
      // 30% chance of glitching
      if (Math.random() < 0.3) {
        const intensity = Math.random() * 0.8 + 0.2 // 0.2 to 1.0
        triggerGlitch(intensity)
      }
    }

    const interval = setInterval(triggerRandomGlitch, 2000)
    return () => clearInterval(interval)
  }, [])

  // Trigger glitch with given intensity
  const triggerGlitch = (intensity: number) => {
    setIsGlitching(true)
    setGlitchIntensity(intensity)

    // Create particles
    if (containerRef.current && textRef.current) {
      const rect = textRef.current.getBoundingClientRect()
      const newParticles = []

      // Number of particles based on intensity
      const particleCount = Math.floor(intensity * 30) + 10

      for (let i = 0; i < particleCount; i++) {
        // Create particles along the text
        const x = Math.random() * rect.width
        const y = Math.random() * rect.height

        newParticles.push({
          id: Date.now() + i,
          x,
          y,
          size: Math.floor(Math.random() * 4) * 2 + 2, // 2, 4, 6, 8
          color: colors[Math.floor(Math.random() * colors.length)],
          velocity: {
            x: (Math.random() - 0.5) * 8 * intensity,
            y: (Math.random() - 0.5) * 8 * intensity,
          },
          life: 0,
          maxLife: 20 + Math.random() * 40 * intensity,
        })
      }

      setParticles((prev) => [...prev, ...newParticles])
    }

    // Reset after a duration based on intensity
    setTimeout(
      () => {
        setIsGlitching(false)
        setGlitchIntensity(0)
      },
      150 + intensity * 350,
    )
  }

  // Animate particles
  useEffect(() => {
    if (particles.length === 0) return

    const animateParticles = () => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: Math.round(p.x + p.velocity.x),
            y: Math.round(p.y + p.velocity.y),
            life: p.life + 1,
          }))
          .filter((p) => p.life < p.maxLife),
      )
    }

    const animationFrame = requestAnimationFrame(animateParticles)
    return () => cancelAnimationFrame(animationFrame)
  }, [particles])

  // Generate random offset for glitch effect
  const getRandomOffset = (intensity: number) => {
    return `${Math.round((Math.random() - 0.5) * 12 * intensity)}px`
  }

  // Handle hover effect
  const handleHover = () => {
    if (!isGlitching) {
      triggerGlitch(0.7)
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`} onMouseEnter={handleHover}>
      {/* Main title */}
      <Link href="/">
        <h1
          ref={textRef}
          className="text-base font-bold text-center font-squares mb-2 relative z-10"
          style={{
            fontSize: "0.7rem",
            letterSpacing: "0.03em",
            lineHeight: "2.2",
          }}
        >
          {text}
        </h1>
      </Link>

      {/* Glitch layers */}
      {isGlitching && (
        <>
          {/* Red channel offset */}
          <div
            className="absolute inset-0 z-20 text-red-500 opacity-70 pointer-events-none"
            style={{
              clipPath: "polygon(0 15%, 100% 15%, 100% 40%, 0 40%, 0 65%, 100% 65%, 100% 90%, 0 90%)",
              transform: `translate(${getRandomOffset(glitchIntensity)}, ${getRandomOffset(glitchIntensity / 2)})`,
              textShadow: `2px 0 #ff2a6d`,
              filter: "brightness(1.2) contrast(1.5)",
            }}
          >
            <h1
              className="text-base font-bold text-center font-squares mb-2"
              style={{
                fontSize: "0.7rem",
                letterSpacing: "0.03em",
                lineHeight: "2.2",
              }}
            >
              {text}
            </h1>
          </div>

          {/* Cyan channel offset */}
          <div
            className="absolute inset-0 z-20 text-cyan-400 opacity-70 pointer-events-none"
            style={{
              clipPath:
                "polygon(0 0, 100% 0, 100% 15%, 0 15%, 0 40%, 100% 40%, 100% 65%, 0 65%, 0 90%, 100% 90%, 100% 100%, 0 100%)",
              transform: `translate(${getRandomOffset(-glitchIntensity)}, ${getRandomOffset(glitchIntensity / 2)})`,
              textShadow: `-2px 0 #05d9e8`,
              filter: "brightness(1.2) contrast(1.5)",
            }}
          >
            <h1
              className="text-base font-bold text-center font-squares mb-2"
              style={{
                fontSize: "0.7rem",
                letterSpacing: "0.03em",
                lineHeight: "2.2",
              }}
            >
              {text}
            </h1>
          </div>

          {/* Scan lines */}
          <div
            className="absolute inset-0 z-30 pointer-events-none opacity-30"
            style={{
              backgroundImage: "linear-gradient(transparent 50%, rgba(0, 0, 0, 0.5) 50%)",
              backgroundSize: `100% ${4}px`,
              mixBlendMode: "overlay",
            }}
          />
        </>
      )}

      {/* Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute z-40 pointer-events-none"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: 1 - particle.life / particle.maxLife,
            boxShadow: `0 0 ${particle.size}px ${particle.color}`,
            filter: "brightness(1.5)",
          }}
        />
      ))}

      {/* Digital noise overlay */}
      {isGlitching && (
        <div
          className="absolute inset-0 z-25 pointer-events-none"
          style={{
            backgroundImage:
              "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAABmJLR0QA/wD/AP+gvaeTAAAA30lEQVRoge2awQ6EIAxFX/f/f9lZNMYYBVqgDnNWJIR7aKHQlkIIIYQQQggJxKr+WNb1ByWE9MYQN1eCqt5+iIhKRFRWcroDlZDWmuKIKYCIrIjIWt1Oa1qQmxvNrTXl0jHHiHm1CeVmRER3QvnVBvNqE8rNZt5aInKKyOnufcyl4x2sNqFcyLEQQgghhBBCyJ9Re2+pFuGo6qmqpz0Xg6lXm1AuZAwiIvP8Nh4R+RhjfGzbdnDOHTnnDmvtO5vFGJP3KHVnqAT5xhhjcs4l51zKOZecc2+llC7vhRBCCCGEkH/kC99QTZw1jjJNAAAAAElFTkSuQmCC')",
            opacity: 0.1 + glitchIntensity * 0.2,
            mixBlendMode: "overlay",
          }}
        />
      )}
    </div>
  )
}

export default CyberpunkGlitchTitle

