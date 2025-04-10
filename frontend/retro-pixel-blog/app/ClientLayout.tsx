"use client"

import "./globals.css"
import { Press_Start_2P, VT323 } from "next/font/google"
import EnhancedLogo from "./components/EnhancedLogo"
import type React from "react"
import BlinkingCursor from "./components/BlinkingCursor"
import ThemeToggle from "./components/ThemeToggle"
import SoundEffect from "./components/SoundEffect"
// 在import部分添加新的背景组件
import DynamicStripesBackground from "./components/DynamicStripesBackground"
import TokenDisplay from "./components/TokenDisplay"
import CyberpunkGlitchTitle from "./components/CyberpunkGlitchTitle"
import CyberpunkUIEffect from "./components/CyberpunkUIEffect"
import CasinoButton from "./components/CasinoButton"
import GamblingElements from "./components/GamblingElements"
// Import the font components
import SquaresFont from "./components/SquaresFont"
import ElvPixelsFont from "./components/ElvPixelsFont"
// Import the new AceCardsLogo component
import AceCardsLogo from "./components/AceCardsLogo"
// Import the AuthProvider
import { AuthProvider } from "./context/auth-context"
import { Toaster } from "sonner"
import { useState, useEffect } from "react"
import { ThemeProvider } from "next-themes"
// 在import部分添加BackgroundMusic组件
import BackgroundMusic from "./components/BackgroundMusic"
// 在import部分添加扑克筹码背景组件
import PokerChipWaterfallBackground from "./components/PokerChipWaterfallBackground"
// Import the NeonEffect component
import NeonAceTitleProps from "./components/TitleEffect.tsx"


const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-press-start-2p",
})

const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-vt323",
})

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <>
      {/* Add fonts to the layout */}
      <SquaresFont />
      <ElvPixelsFont />
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <CyberpunkUIEffect>
            {/* 添加扑克筹码背景组件 */}
            <PokerChipWaterfallBackground />
            
            {/* 注释掉条纹背景组件 */}
            {/* <DynamicStripesBackground /> */}
            
            {/* 保留赌博元素背景 */}
            <GamblingElements density="low" />
            
            <div className="max-w-5xl mx-auto px-8">
              <header className="py-10">
                {/* 修改顶部布局，使三个元素在同一水平线上 */}
                <div className="flex items-center justify-between mb-6">
                  {/* 左侧手部图片 - 进一步放大 */}
                  <div className="relative">
                    <img 
                      src="/hand-removebg-preview.png" 
                      alt="Hand pointer" 
                      className="h-36 w-auto object-contain hand-animation"
                    />
                  </div>
                  
                  {/* 中间标语文字 - 优化无缝滚动效果 */}
                  <div className="text-center overflow-hidden w-3/5">
                    <div className="ticker-tape">
                      <div className="ticker-tape-content">
                        <span className="font-elvpixels03 text-green-400 mx-8">
                          Stake your knowledge, boost your luck, win the prize! Challenge now!
                        </span>
                        <span className="font-elvpixels03 text-green-400 mx-8">
                          Stake your knowledge, boost your luck, win the prize! Challenge now!
                        </span>
                        <span className="font-elvpixels03 text-green-400 mx-8">
                          Stake your knowledge, boost your luck, win the prize! Challenge now!
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 右侧金币余额保持不变 */}
                  <TokenDisplay />
                </div>
                
                <div className="flex flex-col items-center">
                  {/* Replace ColorfulPixelLogo with AceCardsLogo */}
                  <AceCardsLogo />
                  {/* 添加霓虹灯管特效和Ace标志 */}
                  <NeonAceTitleProps
                    title="Effort Ace"
                    color="purple"
                    suit="hearts"
                    className="mt-4"
                    iconSize={0}
                    
                  >
                    
                  </NeonAceTitleProps>
                  
                  {/* 简化副标题区域，移除手部图片 */}
                  <div className="mt-4 flex justify-center w-full">
                    <p
                      className="text-xs text-center font-elvpixels03 flex items-center z-10 relative"
                      style={{ fontSize: "0.5rem" }}
                    >
                      Learn • Play • Win <BlinkingCursor />
                    </p>
                  </div>
                  
                  <div className="mt-6">
                  <EnhancedLogo />
                  </div>
                </div>
              </header>
              <main className={`pb-16 ${pressStart2P.variable} ${vt323.variable} font-sans bg-gray-900 text-green-400 dark:bg-gray-900 dark:text-green-400`}>
                {children}
              </main>
              <footer className="py-10 text-center font-elvpixels03" style={{ fontSize: "0.4rem" }}>
                © 2023 Crypto Quest Casino. All rights reserved.
              </footer>
            </div>
            <SoundEffect />
            <div className="vignette z-50"></div>
            <CasinoButton />
            {/* 添加背景音乐组件 */}
            <BackgroundMusic />
          </CyberpunkUIEffect>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "#1f2937",
                color: "#4ade80",
                border: "2px solid #4ade80",
                fontFamily: '"ElvPixels03", monospace',
                fontSize: "0.8rem",
              },
              className: "pixelated-border",
            }}
          />
        </AuthProvider>
      </ThemeProvider>
      
      <style jsx global>{`
        .font-squares {
          font-family: 'Squares', monospace !important;
          font-size: 0.5rem !important;
          line-height: 2.1 !important;
          letter-spacing: 0.05em !important;
          word-spacing: 0.1em !important;
        }
        .font-elvpixels {
          font-family: 'ElvPixels', monospace !important;
          font-size: 0.5rem !important;
          line-height: 2.2 !important;
        }
        .font-elvpixels03 {
          font-family: 'ElvPixels03', monospace !important;
          font-size: 0.5rem !important;
          line-height: 3 !important;
        }
      `}</style>
    </>
  )
}

