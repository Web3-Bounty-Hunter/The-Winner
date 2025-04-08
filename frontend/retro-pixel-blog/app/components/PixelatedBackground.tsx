"use client"

import { useState, useEffect } from "react"

const PixelatedBackground = () => {
  const [glitchLines, setGlitchLines] = useState<{ top: number; width: number; opacity: number }[]>([])

  // Add occasional horizontal glitch lines to the background
  useEffect(() => {
    const addGlitchLine = () => {
      if (Math.random() > 0.7) {
        const newLine = {
          top: Math.random() * 100,
          width: 20 + Math.random() * 80,
          opacity: 0.1 + Math.random() * 0.2,
        }

        setGlitchLines((prev) => [...prev, newLine])

        // Remove line after a short time
        setTimeout(
          () => {
            setGlitchLines((prev) => prev.filter((line) => line !== newLine))
          },
          200 + Math.random() * 300,
        )
      }
    }

    const interval = setInterval(addGlitchLine, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 z-[-1] opacity-10">
      <div className="absolute inset-0 bg-grid-green-400/30 bg-grid-8 [mask-image:linear-gradient(to_bottom,white,transparent)]" />

      {/* Horizontal glitch lines */}
      {glitchLines.map((line, index) => (
        <div
          key={index}
          className="absolute h-px bg-green-400"
          style={{
            top: `${line.top}%`,
            left: `${(100 - line.width) / 2}%`,
            width: `${line.width}%`,
            opacity: line.opacity,
          }}
        />
      ))}
    </div>
  )
}

export default PixelatedBackground

