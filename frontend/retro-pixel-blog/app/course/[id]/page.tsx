"use client"
import { useState, useEffect } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { courses, questions, getCourseQuestions } from "../../data/courses"
import QuestionCard from "../../components/QuestionCard"
import PixelIcon from "../../components/PixelIcon"
import GlitchEffect from "../../components/GlitchEffect"
import { useRouter } from "next/navigation"

export default function CoursePage({ params }: { params: { id: string } }) {
  const [courseQuestions, setCourseQuestions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const course = courses.find((c) => c.id === params.id)

  useEffect(() => {
    async function loadQuestions() {
      if (!course) return

      setIsLoading(true)
      try {
        const localQuestions = getCourseQuestions(params.id)
        setCourseQuestions(localQuestions)
        if (localQuestions.length === 0) {
          setError("此课程暂无题目数据")
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadQuestions()
  }, [params.id, course])

  if (!course) {
    notFound()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-4 font-pixel">loading...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <GlitchEffect triggerOnHover={true}>
          <Link
            href="/"
            className="pixelated-border p-3 bg-gray-800 hover:bg-gray-700 transition-colors font-squares text-xs"
            style={{ fontSize: "0.35rem" }}
          >
            Back
          </Link>
        </GlitchEffect>
      </div>

      <h2 className="text-xs font-squares mb-6" style={{ fontSize: "0.5rem" }}>
        {course.title}
      </h2>
      <p className="font-elvpixels03 text-xs mb-10" style={{ fontSize: "0.4rem", lineHeight: "1.4" }}>
        {course.description}
      </p>

      <div className="flex items-center gap-3 mb-6">
        <PixelIcon type="coin" size={16} />
        <h3 className="text-xs font-squares" style={{ fontSize: "0.45rem" }}>
          Questions
        </h3>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="grid gap-6">
        {courseQuestions.map((question) => (
          <div 
            key={question.id} 
            className="border border-gray-700 p-4 rounded-md cursor-pointer hover:bg-gray-800 transition-colors"
            onClick={() => router.push(`/question/${question.id}`)}
          >
            <h3 className="font-bold text-xl mb-2">{question.question}</h3>
            <p className="text-gray-300">{question.explanation}</p>
            <div className="flex justify-between mt-2">
              <span className="text-xs bg-blue-900 px-2 py-1 rounded">difficulty: {question.difficulty}</span>
              <span className="text-xs bg-green-900 px-2 py-1 rounded">reward: {question.tokenReward} Token</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

