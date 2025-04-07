"use client"

import "./globals.css"
import { Press_Start_2P, VT323 } from "next/font/google"
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
            <DynamicStripesBackground />
            <GamblingElements density="low" />
            <div className="max-w-5xl mx-auto px-8">
              <header className="py-10">
                <div className="flex justify-end mb-6">
                  <TokenDisplay />
                </div>
                <div className="flex flex-col items-center">
                  {/* Replace ColorfulPixelLogo with AceCardsLogo */}
                  <AceCardsLogo />
                  <CyberpunkGlitchTitle text="Crypto Quest Casino" />
                  <p
                    className="text-xs text-center font-elvpixels03 flex items-center mt-4"
                    style={{ fontSize: "0.5rem" }}
                  >
                    Learn • Play • Win <BlinkingCursor />
                  </p>
                  <div className="mt-6">
                    <ThemeToggle />
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

