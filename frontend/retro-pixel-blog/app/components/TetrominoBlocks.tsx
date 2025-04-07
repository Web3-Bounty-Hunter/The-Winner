"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface TetrominoBlocksProps {
  count: number
}

// Define tetromino shapes (simplified for this example)
const tetrominoes = [
  // I-piece (line)
  [[1, 1, 1, 1]],
  // O-piece (square)
  [
    [1, 1],
    [1, 1],
  ],
  // T-piece
  [
    [0, 1, 0],
    [1, 1, 1],
  ],
  // L-piece
  [
    [1, 0],
    [1, 0],
    [1, 1],
  ],
  // J-piece
  [
    [0, 1],
    [0, 1],
    [1, 1],
  ],
  // S-piece
  [
    [0, 1, 1],
    [1, 1, 0],
  ],
  // Z-piece
  [
    [1, 1, 0],
    [0, 1, 1],
  ],
]

// Define colors for the blocks
const blockColors = [
  "bg-red-400",
  "bg-yellow-400",
  "bg-green-400",
  "bg-blue-400",
  "bg-purple-400",
  "bg-pink-400",
  "bg-indigo-400",
]

const TetrominoBlocks: React.FC<TetrominoBlocksProps> = ({ count }) => {
  const [blocks, setBlocks] = useState<
    {
      id: number
      shape: number[][]
      color: string
      x: number
      y: number
      rotation: number
    }[]
  >([])

  useEffect(() => {
    // Create blocks based on count
    const newBlocks = Array.from({ length: count }).map((_, i) => {
      const shapeIndex = i % tetrominoes.length
      return {
        id: i,
        shape: tetrominoes[shapeIndex],
        color: blockColors[shapeIndex],
        x: (i * 80) % 300, // Distribute horizontally
        y: Math.floor(i / 4) * 80, // And vertically in rows
        rotation: Math.floor(Math.random() * 4) * 90, // Random rotation in 90° increments
      }
    })

    setBlocks(newBlocks)
  }, [count])

  return (
    <div className="relative h-64 w-full overflow-hidden mb-8">
      {blocks.map((block) => (
        <motion.div
          key={block.id}
          className="absolute"
          initial={{
            x: -100,
            y: -100,
            rotate: block.rotation,
            opacity: 0,
          }}
          animate={{
            x: block.x,
            y: block.y,
            rotate: block.rotation,
            opacity: 1,
          }}
          transition={{
            duration: 1,
            delay: block.id * 0.2,
            type: "spring",
            stiffness: 100,
          }}
        >
          <div
            className="grid gap-0.5"
            style={{
              gridTemplateRows: `repeat(${block.shape.length}, 1fr)`,
              gridTemplateColumns: `repeat(${block.shape[0].length}, 1fr)`,
            }}
          >
            {block.shape.flat().map((cell, cellIndex) => (
              <div key={cellIndex} className={`w-6 h-6 ${cell ? block.color : "bg-transparent"}`} />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default TetrominoBlocks

