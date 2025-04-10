"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface NeonEffectProps {
  children: ReactNode
  color?: "blue" | "red" | "green" | "purple" | "gold"
  intensity?: "low" | "medium" | "high"
  pulse?: boolean
  glow?: boolean
  rotate?: boolean
  className?: string
}

export default function NeonEffect({
  children,
  color = "blue",
  intensity = "medium",
  pulse = true,
  glow = true,
  rotate = false,
  className,
}: NeonEffectProps) {
  // Map color names to actual CSS color values
  const colorMap = {
    blue: "rgba(0, 153, 255, VAR)",
    red: "rgba(255, 0, 102, VAR)",
    green: "rgba(0, 255, 128, VAR)",
    purple: "rgba(153, 51, 255, VAR)",
    gold: "rgba(255, 215, 0, VAR)",
  }

  // Map intensity to shadow size and opacity
  const intensityMap = {
    low: { textShadow: 0.5, boxShadow: 3 },
    medium: { textShadow: 1, boxShadow: 6 },
    high: { textShadow: 2, boxShadow: 10 },
  }

  // Create text shadow based on color and intensity
  const getTextShadow = () => {
    const baseColor = colorMap[color].replace("VAR", "1")
    const glowColor = colorMap[color].replace("VAR", "0.7")
    const shadowIntensity = intensityMap[intensity].textShadow

    return `0 0 ${shadowIntensity}px ${baseColor}, 
            0 0 ${shadowIntensity * 2}px ${baseColor}, 
            0 0 ${shadowIntensity * 3}px ${glowColor}`
  }

  // Create animation class if pulse is true
  const pulseClass = pulse ? "animate-pulse-neon" : ""

  // Create glow class if glow is true
  const glowClass = glow ? "animate-glow-neon" : ""

  // Create rotate class if rotate is true
  const rotateClass = rotate ? "animate-rotate-neon" : ""

  return (
    <div
      className={cn("neon-effect", pulseClass, glowClass, rotateClass, className)}
      style={{
        textShadow: getTextShadow(),
        position: "relative",
        display: "inline-block",
        fontSize: "2.5em",
      }}
    >
      {children}
      <style jsx>{`
        @keyframes pulseNeon {
          0%, 100% {
            text-shadow: ${getTextShadow()};
          }
          50% {
            text-shadow: 0 0 ${intensityMap[intensity].textShadow * 0.5}px ${colorMap[color].replace("VAR", "0.5")};
          }
        }
        .animate-pulse-neon {
          animation: pulseNeon 2s infinite;
        }
        @keyframes glowNeon {
          0%, 100% {
            filter: brightness(1);
          }
          50% {
            filter: brightness(1.5);
          }
        }
        .animate-glow-neon {
          animation: glowNeon 3s infinite;
        }
        @keyframes rotateNeon {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        .animate-rotate-neon {
          animation: rotateNeon 5s linear infinite;
        }
      `}</style>
    </div>
  )
}
