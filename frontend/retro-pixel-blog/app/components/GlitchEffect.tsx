"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"

interface Particle {
  id: number
  x: number
  y: number
  size: number
  color: string
  velocity: {
    x: number
    y: number
  }
  life: number
  maxLife: number
}

interface GlitchEffectProps {
  children: React.ReactNode
  className?: string
  triggerOnHover?: boolean
  randomTrigger?: boolean
  triggerFrequency?: number // in milliseconds
}

const GlitchEffect: React.FC<GlitchEffectProps> = ({
  children,
  className = "",
  triggerOnHover = false,
  randomTrigger = false,
  triggerFrequency = 1000,
}) => {
  const [isGlitching, setIsGlitching] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Colors for the glitch effect and particles - updated to match font theme
  const colors = ["#4ade80", "#22d3ee", "#fb7185", "#a78bfa", "#fbbf24", "#d946ef", "#f97316"]

  // Trigger glitch effect randomly
  useEffect(() => {
    if (!randomTrigger) return

    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.5) {
        // Increased probability (was 0.7)
        triggerGlitch()
      }
    }, triggerFrequency)

    return () => clearInterval(glitchInterval)
  }, [randomTrigger, triggerFrequency])

  // Trigger glitch on hover if enabled
  useEffect(() => {
    if (triggerOnHover && isHovering) {
      triggerGlitch()
    }
  }, [isHovering, triggerOnHover])

  const triggerGlitch = () => {
    setIsGlitching(true)
    setTimeout(() => setIsGlitching(false), 150 + Math.random() * 250)

    // Create particles when glitching
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const newParticles: Particle[] = []

      // Create 8-20 particles - increased for more visual impact
      const particleCount = 8 + Math.floor(Math.random() * 12)

      for (let i = 0; i < particleCount; i++) {
        // Make particles more pixel-like with consistent sizes
        const pixelSize = 2 + Math.floor(Math.random() * 3) * 2 // Only even sizes: 2, 4, 6

        newParticles.push({
          id: Date.now() + i,
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          size: pixelSize,
          color: colors[Math.floor(Math.random() * colors.length)],
          velocity: {
            x: (Math.random() - 0.5) * 5, // Increased speed
            y: (Math.random() - 0.5) * 5,
          },
          life: 0,
          maxLife: 15 + Math.random() * 25, // Slightly longer particle life
        })
      }

      setParticles((prev) => [...prev, ...newParticles])
    }
  }

  // Animate particles
  useEffect(() => {
    if (particles.length === 0) return

    const animationFrame = requestAnimationFrame(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            // Make movement more pixelated by rounding to whole numbers
            x: Math.round(p.x + p.velocity.x),
            y: Math.round(p.y + p.velocity.y),
            life: p.life + 1,
          }))
          .filter((p) => p.life < p.maxLife),
      )
    })

    return () => cancelAnimationFrame(animationFrame)
  }, [particles])

  // Generate random offset for glitch effect
  const getRandomOffset = () => {
    // Make offsets more pixel-aligned (multiples of 2px)
    return `${Math.round((Math.random() - 0.5) * 8) * 2}px`
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-visible ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Main content */}
      <div className={`relative z-10 ${isGlitching ? "opacity-90" : ""}`}>{children}</div>

      {/* Glitch layers */}
      {isGlitching && (
        <>
          <div
            className="absolute inset-0 z-20 text-red-400 opacity-70"
            style={{
              clipPath:
                "polygon(0 25%, 100% 25%, 100% 30%, 0 30%, 0 50%, 100% 50%, 100% 55%, 0 55%, 0 75%, 100% 75%, 100% 80%, 0 80%)",
              transform: `translate(${getRandomOffset()}, ${getRandomOffset()})`,
              textShadow: "2px 0 #ff0000",
            }}
          >
            {children}
          </div>
          <div
            className="absolute inset-0 z-20 text-blue-400 opacity-70"
            style={{
              clipPath:
                "polygon(0 0, 100% 0, 100% 25%, 0 25%, 0 30%, 100% 30%, 100% 50%, 0 50%, 0 55%, 100% 55%, 100% 75%, 0 75%)",
              transform: `translate(${getRandomOffset()}, ${getRandomOffset()})`,
              textShadow: "-2px 0 #00ffff",
            }}
          >
            {children}
          </div>
        </>
      )}

      {/* Particles - updated to be more pixel-like */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute z-30"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: 1 - particle.life / particle.maxLife,
            // No border-radius to keep particles square/pixelated
            transform: `scale(${1 - (particle.life / particle.maxLife) * 0.5})`,
            boxShadow: `0 0 ${particle.size / 2}px ${particle.color}`, // Add glow effect
          }}
        />
      ))}
    </div>
  )
}

export default GlitchEffect

