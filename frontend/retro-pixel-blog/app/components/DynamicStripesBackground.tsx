"use client"

import { useEffect, useState } from "react"

const DynamicStripesBackground = () => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden">
      {/* 黑色条纹 - 向右上角移动 */}
      <div
        className="absolute inset-0 opacity-20 animate-stripe-black"
        style={{
          background: "repeating-linear-gradient(45deg, black, black 10px, transparent 10px, transparent 20px)",
          backgroundSize: "200% 200%",
        }}
      />

      {/* 白色条纹 - 向左下角移动 */}
      <div
        className="absolute inset-0 opacity-10 animate-stripe-white"
        style={{
          background: "repeating-linear-gradient(-45deg, white, white 10px, transparent 10px, transparent 20px)",
          backgroundSize: "200% 200%",
        }}
      />

      {/* 添加一个暗色渐变覆盖层，使背景不会太亮 */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 to-gray-900/80" />
    </div>
  )
}

export default DynamicStripesBackground

