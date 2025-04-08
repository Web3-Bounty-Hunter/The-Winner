"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"

// 修改 ChipElement 接口，移除旋转相关属性
interface ChipElement {
  id: number
  x: number
  y: number
  scale: number
  opacity: number
  speed: number
  row: number
  column: number // 添加列索引以保持精确位置
  direction: "left" | "right" // 移动方向
}

export default function PokerChipWaterfallBackground() {
  const [chips, setChips] = useState<ChipElement[]>([])
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const animationRef = useRef<number>()
  const lastTimeRef = useRef<number>(0)

  // 初始化筹码元素
  useEffect(() => {
    if (typeof window === "undefined") return

    // 设置尺寸 - 由于旋转45度，我们需要更大的覆盖区域
    const width = window.innerWidth * 1.5 // 增加宽度以覆盖旋转后的区域
    const height = window.innerHeight * 1.5 // 增加高度以覆盖旋转后的区域
    setDimensions({ width, height })

    // 创建初始筹码
    const initialChips: ChipElement[] = []

    // 筹码尺寸和间距设置
    const chipSize = 60 // 筹码图像基础大小
    const chipScale = 3.0 // 增大筹码缩放比例（从2.0增加到3.0）
    const scaledChipSize = chipSize * chipScale // 实际显示大小

    // 计算间距 - 减小间距以解决间隙问题
    const horizontalSpacing = scaledChipSize * 0.9 // 减小水平间距，使筹码更紧密
    const verticalSpacing = scaledChipSize * 0.7 // 大幅减小垂直间距，使行更紧密

    // 计算行数和每行筹码数 - 增加数量以覆盖旋转后的区域
    const rowCount = Math.ceil(height / verticalSpacing) + 6 // 增加额外行以确保覆盖

    // 计算每行需要的筹码数量，确保足够覆盖整个屏幕宽度
    // 添加额外的筹码以确保滚动时无缝衔接
    const chipsPerRow = Math.ceil(width / horizontalSpacing) + 6 // 增加额外筹码以确保覆盖

    let chipId = 0

    // 为每行创建筹码
    for (let row = 0; row < rowCount; row++) {
      // 计算这一行的y坐标 - 使用精确计算确保均匀分布
      const rowY = row * verticalSpacing

      // 确定这一行的移动方向
      const direction = row % 2 === 0 ? "left" : "right"

      // 为这一行创建筹码
      for (let i = 0; i < chipsPerRow; i++) {
        // 均匀分布在一行中 - 使用精确计算确保均匀间距
        // 为交错行添加一个小的水平偏移，创建更自然的排列
        const offset = direction === "left" ? 0 : horizontalSpacing / 2
        const chipX = i * horizontalSpacing + offset

        initialChips.push({
          id: chipId++,
          x: chipX,
          y: rowY,
          scale: chipScale, // 增大尺寸
          opacity: 0.7, // 统一透明度
          speed: 0.4, // 减慢速度（从0.8减小到0.4）
          row: row,
          column: i, // 保存列索引
          direction: direction,
        })
      }
    }

    setChips(initialChips)

    // 处理窗口大小变化
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth * 1.5,
        height: window.innerHeight * 1.5,
      })
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // 动画筹码
  useEffect(() => {
    if (chips.length === 0 || dimensions.width === 0) return

    const animate = (time: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = time
      }

      const deltaTime = time - lastTimeRef.current
      lastTimeRef.current = time

      // 获取每行的配置信息，用于精确计算
      const rowConfigs = new Map<
        number,
        {
          horizontalSpacing: number
          offset: number
          direction: "left" | "right"
        }
      >()

      // 计算每行的配置
      chips.forEach((chip) => {
        if (!rowConfigs.has(chip.row)) {
          const chipSize = 60 * chip.scale
          const horizontalSpacing = chipSize * 0.9
          const direction = chip.row % 2 === 0 ? "left" : "right"
          const offset = direction === "left" ? 0 : horizontalSpacing / 2

          rowConfigs.set(chip.row, {
            horizontalSpacing,
            offset,
            direction,
          })
        }
      })

      setChips((prevChips) =>
        prevChips.map((chip) => {
          // 获取该行的配置
          const rowConfig = rowConfigs.get(chip.row)!
          const horizontalSpacing = rowConfig.horizontalSpacing

          // 计算筹码宽度和屏幕宽度，用于精确的循环滚动
          const chipWidth = 60 * chip.scale
          const screenWidth = dimensions.width

          // 根据方向移动
          let newX = chip.x

          if (chip.direction === "left") {
            // 向左移动
            newX = chip.x - chip.speed * (deltaTime / 16)

            // 如果筹码完全移出屏幕左侧，将其直接移到屏幕右侧
            // 使用精确的位置计算，确保间距一致
            if (newX < -chipWidth * 2) {
              // 找出该行中最右边的筹码
              const sameRowChips = prevChips.filter((c) => c.row === chip.row)
              const rightmostChip = sameRowChips.reduce(
                (rightmost, current) => (current.x > rightmost.x ? current : rightmost),
                sameRowChips[0],
              )

              // 将筹码放在最右边筹码的右侧，保持精确间距
              newX = rightmostChip.x + horizontalSpacing
            }
          } else {
            // 向右移动
            newX = chip.x + chip.speed * (deltaTime / 16)

            // 如果筹码完全移出屏幕右侧，将其直接移到屏幕左侧
            // 使用精确的位置计算，确保间距一致
            if (newX > screenWidth + chipWidth * 2) {
              // 找出该行中最左边的筹码
              const sameRowChips = prevChips.filter((c) => c.row === chip.row)
              const leftmostChip = sameRowChips.reduce(
                (leftmost, current) => (current.x < leftmost.x ? current : leftmost),
                sameRowChips[0],
              )

              // 将筹码放在最左边筹码的左侧，保持精确间距
              newX = leftmostChip.x - horizontalSpacing
            }
          }

          return {
            ...chip,
            x: newX,
          }
        }),
      )

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [chips, dimensions])

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
      {/* 动画渐变背景 */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900"
        style={{
          backgroundSize: "400% 400%",
          animation: "gradient-shift 15s ease infinite",
        }}
      />

      {/* 网格叠加 */}
      <div className="absolute inset-0 bg-grid-green-400/10 bg-grid-8"></div>

      {/* 筹码容器 - 修改旋转角度为45度 */}
      <div
        className="absolute inset-0"
        style={{
          transform: "rotate(-45deg)", // 逆时针旋转45度
          transformOrigin: "center center", // 从中心点旋转
          width: "150%", // 增加宽度以覆盖旋转后的区域
          height: "150%", // 增加高度以覆盖旋转后的区域
          left: "-25%", // 调整位置以居中
          top: "-25%", // 调整位置以居中
        }}
      >
        {/* 筹码元素 */}
        {chips.map((chip) => (
          <div
            key={chip.id}
            className="absolute"
            style={{
              left: `${chip.x}px`,
              top: `${chip.y}px`,
              transform: `scale(${chip.scale})`,
              opacity: chip.opacity,
              zIndex: 1, // 统一z-index
              transition: "none", // 确保没有过渡效果
            }}
          >
            <Image
              src="/images/poker-chip.png"
              alt="Poker Chip"
              width={60}
              height={60}
              className="pixelated"
              style={{
                imageRendering: "pixelated",
                objectFit: "contain",
              }}
            />
          </div>
        ))}
      </div>

      {/* 故障线 */}
      <GlitchLines />

      {/* 暗角效果 */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent to-black opacity-50"></div>
    </div>
  )
}

// 故障线组件
function GlitchLines() {
  const [lines, setLines] = useState<{ top: number; width: number; opacity: number; duration: number }[]>([])

  useEffect(() => {
    const createLine = () => {
      if (Math.random() > 0.7) {
        const newLine = {
          top: Math.random() * 100,
          width: 20 + Math.random() * 80,
          opacity: 0.1 + Math.random() * 0.3,
          duration: 200 + Math.random() * 500,
        }

        setLines((prev) => [...prev, newLine])

        setTimeout(() => {
          setLines((prev) => prev.filter((line) => line !== newLine))
        }, newLine.duration)
      }
    }

    const interval = setInterval(createLine, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      {lines.map((line, index) => (
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
    </>
  )
} 