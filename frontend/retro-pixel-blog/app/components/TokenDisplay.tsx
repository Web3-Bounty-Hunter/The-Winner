"use client"

import { useEffect, useState } from "react"
import { Coins, User } from "lucide-react"
import GlitchEffect from "./GlitchEffect"
import { useAuth } from "../context/auth-context"
import Link from "next/link"

const TokenDisplay = () => {
  const { user, isLoading } = useAuth()
  const [isGlitching, setIsGlitching] = useState(false)
  const [isFlipping, setIsFlipping] = useState(false)
  const [loginHighlight, setLoginHighlight] = useState(false)

  useEffect(() => {
    // Listen for token updates
    const handleTokenUpdate = () => {
      // Glitch effect when tokens change
      setIsGlitching(true)
      setTimeout(() => setIsGlitching(false), 1000)

      // Coin flip animation
      setIsFlipping(true)
      setTimeout(() => setIsFlipping(false), 2000)
    }

    window.addEventListener("tokenUpdate", handleTokenUpdate)

    return () => {
      window.removeEventListener("tokenUpdate", handleTokenUpdate)
    }
  }, [])

  // Add highlight effect when user changes
  useEffect(() => {
    if (user) {
      setLoginHighlight(true)
      const timer = setTimeout(() => setLoginHighlight(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [user])

  // Store current path when clicking login
  const handleLoginClick = () => {
    if (!user) {
      localStorage.setItem("returnUrl", window.location.pathname)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <GlitchEffect triggerOnHover={true}>
        <div
          className={`flex items-center gap-3 px-5 py-3 casino-border bg-purple-900/30 rounded ${isGlitching ? "digital-distortion" : ""}`}
        >
          <div className={`${isFlipping ? "coin-flip" : ""}`}>
            <Coins className="w-5 h-5 text-yellow-400" />
          </div>
          <span className="font-squares text-yellow-400" style={{ fontSize: "0.35rem" }}>
            {user ? user.coins : 0}
          </span>
        </div>
      </GlitchEffect>

      <GlitchEffect triggerOnHover={true}>
        <Link
          href={user ? "/profile" : "/auth"}
          onClick={handleLoginClick}
          className={`flex items-center gap-3 px-5 py-3 pixelated-border ${
            user
              ? loginHighlight
                ? "bg-green-800 animate-pulse"
                : "bg-gray-800 hover:bg-gray-700"
              : "bg-gray-800 hover:bg-gray-700"
          } rounded transition-colors`}
        >
          <User className={`w-5 h-5 ${user && loginHighlight ? "text-green-400" : ""}`} />
          <span
            className={`font-squares ${user && loginHighlight ? "text-green-400" : ""}`}
            style={{ fontSize: "0.35rem" }}
          >
            {user ? user.username : "Login"}
          </span>
        </Link>
      </GlitchEffect>
    </div>
  )
}

export default TokenDisplay

