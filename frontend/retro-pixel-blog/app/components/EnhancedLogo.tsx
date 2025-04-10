"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

const EnhancedLogo = () => {
  const [isHovered, setIsHovered] = useState(false)
  const [isGlowing, setIsGlowing] = useState(false)

  // 添加呼吸灯效果
  useEffect(() => {
    const interval = setInterval(() => {
      setIsGlowing(prev => !prev)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div 
      className="relative group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 主logo图片 */}
      <div className={`
        relative transition-transform duration-300 ease-in-out
        ${isHovered ? 'scale-110' : 'scale-100'}
      `}>
        <Image
          src="/open-campus-edu-logo.png"
          alt="OpenCampus EDU Logo"
          width={50}
          height={15}
          className="rounded-lg"
          style={{
            filter: `drop-shadow(0 0 8px rgba(74, 222, 128, ${isGlowing ? 0.6 : 0.2}))`
          }}
        />
      </div>

      {/* 光晕效果 */}
      <div className={`
        absolute inset-0 
        bg-gradient-to-r from-green-400/20 via-transparent to-green-400/20
        rounded-lg transition-opacity duration-500
        ${isHovered ? 'opacity-100' : 'opacity-0'}
      `} />

      {/* 底部反光效果 */}
      <div className={`
        absolute -bottom-4 left-0 right-0 h-4
        bg-gradient-to-b from-green-400/30 to-transparent
        transform scale-x-75 blur-sm
        transition-opacity duration-300
        ${isHovered ? 'opacity-100' : 'opacity-30'}
      `} />

      {/* 悬停时显示的标语 */}
      <div className={`
        absolute -bottom-8 left-0 right-0
        text-center font-elvpixels03 text-green-400/50
        transition-all duration-300 whitespace-nowrap overflow-hidden
        ${isHovered ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'}
      `}
        style={{ fontSize: "0.2rem" }}
      >
        Go!
      </div>
    </div>
  )
}

export default EnhancedLogo 