"use client"

import type React from "react"
import { useState } from "react"
import { Brain, Flame } from "lucide-react"
import GlitchEffect from "../../components/GlitchEffect"

interface QuestionModalProps {
  isOpen: boolean
  question: string
  options: string[]
  onAnswer: (answer: string) => void
  cardType: 'blue' | 'gold' | 'red'
}

const QuestionModal: React.FC<QuestionModalProps> = ({
  isOpen,
  question,
  options,
  onAnswer,
  cardType
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  // Get difficulty icon
  const getDifficultyIcon = () => {
    switch (cardType) {
      case "blue":
        return <Brain className="w-5 h-5 text-blue-400" />
      case "gold":
        return <Brain className="w-5 h-5 text-yellow-400" />
      case "red":
        return <Flame className="w-5 h-5 text-red-400" />
    }
  }

  // Get difficulty label
  const getDifficultyLabel = () => {
    switch (cardType) {
      case "blue":
        return "Blue"
      case "gold":
        return "Gold"
      case "red":
        return "Red"
    }
  }

  // Handle submit
  const handleSubmit = () => {
    if (selectedOption === null) return

    const correct = selectedOption === options.indexOf(question)
    setIsCorrect(correct)
    setIsSubmitted(true)

    // Delay to show result before closing
    setTimeout(() => {
      onAnswer(options[selectedOption])
    }, 1500)
  }

  return (
    <div className={`question-modal ${isOpen ? 'visible' : ''} ${cardType}-card`}>
      <h3>{question}</h3>
      <div className="options">
        {options.map((option, index) => (
          <button 
            key={index}
            onClick={() => !isSubmitted && setSelectedOption(index)}
            className={`option-btn ${cardType}-btn ${
              isSubmitted
                ? index === options.indexOf(question)
                  ? "bg-green-800 border-green-500 border-2"
                  : "bg-gray-700"
                : selectedOption === index
                  ? "bg-purple-800 border-purple-500 border-2"
                  : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            {option}
          </button>
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
  )
}

export default QuestionModal

