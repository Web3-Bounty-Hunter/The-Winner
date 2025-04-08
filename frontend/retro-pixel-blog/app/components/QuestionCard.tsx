import type React from "react"
import Link from "next/link"
import GlitchEffect from "./GlitchEffect"

interface QuestionCardProps {
  id: number
  title: string
  tokenReward: number
}

const QuestionCard: React.FC<QuestionCardProps> = ({ id, title, tokenReward }) => {
  return (
    <GlitchEffect triggerOnHover={true}>
      <Link
        href={`/question/${id}`}
        className="block p-6 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors casino-border"
      >
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-squares" style={{ fontSize: "0.4rem", maxWidth: "70%" }}>
            {title}
          </h4>
          <div className="flex items-center gap-3">
            <span className="font-squares text-yellow-400 text-xs" style={{ fontSize: "0.35rem" }}>
              {tokenReward}
            </span>
            <span className="font-squares text-yellow-400 text-xs" style={{ fontSize: "0.35rem" }}>
              tokens
            </span>
          </div>
        </div>
      </Link>
    </GlitchEffect>
  )
}

export default QuestionCard

