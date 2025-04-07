"use client"

import type React from "react"
import Link from "next/link"
import GlitchEffect from "./GlitchEffect"

interface GlitchTitleProps {
  text: string
  className?: string
}

const GlitchTitle: React.FC<GlitchTitleProps> = ({ text, className = "" }) => {
  return (
    <GlitchEffect
      className={className}
      randomTrigger={true}
      triggerFrequency={800} // Increased frequency (was 2000)
    >
      <Link href="/">
        <h1
          className="text-base font-bold text-center font-squares mb-2"
          style={{
            fontSize: "0.7rem",
            letterSpacing: "0.03em",
            lineHeight: "2.2",
          }}
        >
          {text}
        </h1>
      </Link>
    </GlitchEffect>
  )
}

export default GlitchTitle

