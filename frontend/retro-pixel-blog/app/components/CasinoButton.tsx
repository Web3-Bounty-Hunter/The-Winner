"use client"
import Link from "next/link"
import { Dices } from "lucide-react"
import GlitchEffect from "./GlitchEffect"

const CasinoButton = () => {
  return (
    <GlitchEffect triggerOnHover={true}>
      <Link
        href="/casino"
        className="fixed bottom-10 right-10 z-40 flex items-center gap-3 px-5 py-3 bg-purple-900 rounded-lg pixelated-border hover:bg-purple-800 transition-colors"
      >
        <Dices className="w-5 h-5 text-purple-300" />
        <span className="font-squares text-purple-300" style={{ fontSize: "0.4rem" }}>
          Crypto Casino
        </span>
      </Link>
    </GlitchEffect>
  )
}

export default CasinoButton

