"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { notFound } from "next/navigation"
import Link from "next/link"
import { use } from 'react'
import { Button } from "@/components/ui/button"
import PixelIcon from "@/app/components/PixelIcon"
import TokenRewardAnimation from "@/app/components/TokenRewardAnimation"
import GlitchEffect from "@/app/components/GlitchEffect"
import { getQuestion, getNextQuestion, updateUserTokens } from "@/app/lib/api-client"
import { questions } from "../../data/courses" // 导入本地题目数据

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string | string[];
  explanation: string;
  source: string;
  difficulty: string;
  topic: string;
  courseId: string;
  tokenReward: number;
  isMultipleChoice: boolean;
  title?: string;
}

export default function QuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const questionId = Number(resolvedParams.id)
  
  const [question, setQuestion] = useState<Question | null>(null)
  const [selectedOption, setSelectedOption] = useState<number | number[] | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  const [showRewardAnimation, setShowRewardAnimation] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 获取题目的函数
  const fetchQuestion = async (id: number) => {
    try {
      setLoading(true)
      
      // 从本地数据中查找题目，而不是调用API
      const localQuestion = questions.find(q => q.id === id)
      
      if (localQuestion) {
        setQuestion(localQuestion)
      } else {
        // 如果本地没有找到，再尝试从API获取
        const data = await getQuestion(id)
        setQuestion(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取题目失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取下一题
  const fetchNextQuestion = async (courseId: string, currentId: number) => {
    try {
      // 从本地数据中查找下一题
      const courseQuestions = questions.filter(q => q.courseId === courseId)
      const currentIndex = courseQuestions.findIndex(q => q.id === currentId)
      
      if (currentIndex < courseQuestions.length - 1) {
        return courseQuestions[currentIndex + 1]
      } else {
        return null
      }
    } catch (err) {
      console.error('获取下一题失败:', err)
      return null
    }
  }

  useEffect(() => {
    fetchQuestion(questionId)
  }, [questionId])

  // 检查答案是否正确的函数
  const checkAnswer = (selected: number | number[], correct: string | string[]) => {
    if (!question) return false
    
    if (Array.isArray(selected)) {
      const correctAnswers = Array.isArray(correct) ? correct : correct.split(',')
      return selected.every(s => correctAnswers.includes(String.fromCharCode(65 + s))) &&
             correctAnswers.every(c => selected.includes(c.charCodeAt(0) - 65))
    } else {
      return String.fromCharCode(65 + selected) === correct
    }
  }

  // 提交答案的处理函数
  const handleSubmit = async () => {
    if (selectedOption === null || !question) return

    setIsSubmitted(true)
    const correct = checkAnswer(selectedOption, question.correctAnswer)
    setIsCorrect(correct)

    if (correct) {
      setShowRewardAnimation(true)
      try {
        await updateUserTokens(question.id, question.tokenReward)
        // 更新本地代币显示
        window.dispatchEvent(new Event("tokenUpdate"))
      } catch (err) {
        console.error('更新代币失败:', err)
      }
    }

    setTimeout(() => {
      setShowExplanation(true)
    }, 1000)
  }

  // 渲染选项的函数
  const renderOptions = () => {
    if (!question) return null
    
    return question.options.map((option, index) => (
      <GlitchEffect key={index} triggerOnHover={true} className="block">
        <div
          className={`p-4 rounded cursor-pointer font-elvpixels03 transition-colors ${
            isSubmitted
              ? (Array.isArray(question.correctAnswer)
                  ? question.correctAnswer.includes(String.fromCharCode(65 + index))
                  : String.fromCharCode(65 + index) === question.correctAnswer)
                ? "bg-green-800 border-green-500 border-2"
                : Array.isArray(selectedOption)
                  ? selectedOption.includes(index)
                    ? "bg-red-800 border-red-500 border-2"
                    : "bg-gray-700"
                  : selectedOption === index
                    ? "bg-red-800 border-red-500 border-2"
                    : "bg-gray-700"
              : Array.isArray(selectedOption)
                ? selectedOption.includes(index)
                  ? "bg-blue-800 border-blue-500 border-2"
                  : "bg-gray-700 hover:bg-gray-600"
                : selectedOption === index
                  ? "bg-blue-800 border-blue-500 border-2"
                  : "bg-gray-700 hover:bg-gray-600"
          }`}
          onClick={() => {
            if (isSubmitted) return
            if (question.isMultipleChoice) {
              setSelectedOption(prev => {
                const prevSelected = Array.isArray(prev) ? prev : []
                return prevSelected.includes(index)
                  ? prevSelected.filter(i => i !== index)
                  : [...prevSelected, index]
              })
            } else {
              setSelectedOption(index)
            }
          }}
        >
          <div className="flex items-center gap-3">
            <span className="inline-block w-5 h-5 text-center border border-current rounded text-xs">
              {String.fromCharCode(65 + index)}
            </span>
            <span>{option}</span>
          </div>
        </div>
      </GlitchEffect>
    ))
  }

  const handleNextQuestion = async () => {
    if (!question) return
    
    const nextQuestion = await fetchNextQuestion(question.courseId, question.id)
    if (nextQuestion) {
      router.push(`/question/${nextQuestion.id}`)
    } else {
      router.push(`/course/${question.courseId}`)
    }
  }

  if (loading) {
    return <div className="text-center p-4">加载中...</div>
  }

  if (error || !question) {
    return <div className="text-center p-4 text-red-500">错误: {error || '题目未找到'}</div>
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <GlitchEffect triggerOnHover={true}>
          <Link
            href="/"
            className="pixelated-border p-3 bg-gray-800 hover:bg-gray-700 transition-colors font-squares text-xs"
            style={{ fontSize: "0.35rem" }}
          >
            Back to Home
          </Link>
        </GlitchEffect>
        <div className="flex items-center gap-3">
          <PixelIcon type="coin" size={16} />
          <span className="font-squares text-yellow-400" style={{ fontSize: "0.35rem" }}>
            {question.tokenReward}
          </span>
        </div>
      </div>

      <h2 className="text-xs font-squares mb-8" style={{ fontSize: "0.5rem" }}>
        {question.title}
      </h2>

      <div className="p-8 bg-gray-800 rounded-lg pixelated-border mb-8">
        <p className="font-elvpixels03 text-xs mb-8" style={{ fontSize: "0.4rem", lineHeight: "1.4" }}>
          {question.question}
        </p>

        <div className="space-y-4">
          {renderOptions()}
        </div>
      </div>

      {!isSubmitted ? (
        <GlitchEffect triggerOnHover={true}>
          <Button
            onClick={handleSubmit}
            disabled={selectedOption === null}
            className="w-full font-squares text-xs py-4"
            style={{ fontSize: "0.4rem" }}
          >
            Submit Answer
          </Button>
        </GlitchEffect>
      ) : (
        <div className="space-y-6">
          <div className={`p-6 rounded-lg pixelated-border ${isCorrect ? "bg-green-900" : "bg-red-900"}`}>
            <div className="flex items-center gap-3 font-squares">
              {isCorrect ? (
                <>
                  <PixelIcon type="check" size={16} />
                  <span style={{ fontSize: "0.4rem" }}>Correct! You earned {question.tokenReward} tokens!</span>
                </>
              ) : (
                <>
                  <PixelIcon type="cross" size={16} />
                  <span style={{ fontSize: "0.4rem" }}>Incorrect! Try again next time.</span>
                </>
              )}
            </div>

            {showExplanation && (
              <div className="mt-6 font-elvpixels03">
                <p className="text-xs opacity-80" style={{ fontSize: "0.4rem" }}>
                  Explanation:
                </p>
                <p className="text-xs mt-2" style={{ fontSize: "0.4rem", lineHeight: "1.4" }}>
                  {question.explanation}
                </p>
              </div>
            )}
          </div>

          <GlitchEffect triggerOnHover={true}>
            <Button
              onClick={handleNextQuestion}
              className="w-full font-squares text-xs py-4"
              style={{ fontSize: "0.4rem" }}
            >
              Next Question
            </Button>
          </GlitchEffect>
        </div>
      )}
      {showRewardAnimation && (
        <TokenRewardAnimation amount={question.tokenReward} onComplete={() => setShowRewardAnimation(false)} />
      )}
    </div>
  )
}

