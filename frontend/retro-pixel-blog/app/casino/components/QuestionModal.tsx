"use client"

import type React from "react"
import { useState } from "react"
import { Brain, Flame } from "lucide-react"
import GlitchEffect from "../../components/GlitchEffect"

interface QuestionModalProps {
  question: {
    id: number
    text: string
    options: string[]
    correctAnswer: number
  }
  difficulty: "easy" | "medium" | "hard" | "extreme"
  onAnswer: (isCorrect: boolean) => void
}

const QuestionModal: React.FC<QuestionModalProps> = ({ question, difficulty, onAnswer }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  // Get difficulty icon
  const getDifficultyIcon = () => {
    switch (difficulty) {
      case "easy":
        return <Brain className="w-5 h-5 text-green-400" />
      case "medium":
        return <Brain className="w-5 h-5 text-yellow-400" />
      case "hard":
        return <Brain className="w-5 h-5 text-orange-400" />
      case "extreme":
        return <Flame className="w-5 h-5 text-red-400" />
    }
  }

  // Get difficulty label
  const getDifficultyLabel = () => {
    switch (difficulty) {
      case "easy":
        return "Easy"
      case "medium":
        return "Medium"
      case "hard":
        return "Hard"
      case "extreme":
        return "Extreme"
    }
  }

  // Handle submit
  const handleSubmit = () => {
    if (selectedOption === null) return

    const correct = selectedOption === question.correctAnswer
    setIsCorrect(correct)
    setIsSubmitted(true)

    // Delay to show result before closing
    setTimeout(() => {
      onAnswer(correct)
    }, 1500)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-8 rounded-lg casino-border max-w-lg w-full">
        <div className="flex items-center gap-3 mb-6">
          {getDifficultyIcon()}
          <h3 className="text-lg font-squares text-purple-300" style={{ fontSize: "0.55rem" }}>
            {getDifficultyLabel()} Question
          </h3>
        </div>

        <p className="font-elvpixels03 text-base mb-8" style={{ fontSize: "0.4rem", lineHeight: "1.4" }}>
          {question.text}
        </p>

        <div className="space-y-4 mb-8">
          {question.options.map((option, index) => (
            <div
              key={index}
              className={`p-4 rounded cursor-pointer font-elvpixels03 transition-colors ${
                isSubmitted
                  ? index === question.correctAnswer
                    ? "bg-green-800 border-green-500 border-2"
                    : index === selectedOption
                      ? "bg-red-800 border-red-500 border-2"
                      : "bg-gray-700"
                  : selectedOption === index
                    ? "bg-purple-800 border-purple-500 border-2"
                    : "bg-gray-700 hover:bg-gray-600"
              }`}
              onClick={() => !isSubmitted && setSelectedOption(index)}
            >
              <div className="flex items-center gap-3">
                <span
                  className="inline-block w-6 h-6 text-center border border-current rounded text-xs"
                  style={{ fontSize: "0.4rem" }}
                >
                  {String.fromCharCode(65 + index)}
                </span>
                <span style={{ fontSize: "0.4rem", lineHeight: "1.4" }}>{option}</span>
              </div>
            </div>
          ))}
        </div>

        {!isSubmitted ? (
          <GlitchEffect triggerOnHover={true}>
            <button
              onClick={handleSubmit}
              disabled={selectedOption === null}
              className={`w-full casino-border p-4 font-squares text-xs ${
                selectedOption === null
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-purple-900 hover:bg-purple-800 text-purple-300"
              }`}
              style={{ fontSize: "0.4rem" }}
            >
              Submit Answer
            </button>
          </GlitchEffect>
        ) : (
          <div className={`p-6 rounded-lg casino-border ${isCorrect ? "bg-green-900" : "bg-red-900"}`}>
            <div className="flex items-center gap-3 font-elvpixels03">
              {isCorrect ? (
                <span style={{ fontSize: "0.4rem", lineHeight: "1.4" }}>Correct! Card revealed!</span>
              ) : (
                <span style={{ fontSize: "0.4rem", lineHeight: "1.4" }}>Incorrect! Card burned!</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default QuestionModal

