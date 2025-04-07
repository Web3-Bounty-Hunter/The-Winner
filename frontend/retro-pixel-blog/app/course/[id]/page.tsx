"use client"
import { useState, useEffect } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { courses, questions, fetchQuestionsFromBackend } from "../../data/courses"
import QuestionCard from "../../components/QuestionCard"
import PixelIcon from "../../components/PixelIcon"
import GlitchEffect from "../../components/GlitchEffect"

export default function CoursePage({ params }: { params: { id: string } }) {
  const [courseQuestions, setCourseQuestions] = useState<typeof questions>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const course = courses.find((c) => c.id === params.id)

  useEffect(() => {
    async function loadQuestions() {
      if (!course) return

      setIsLoading(true)
      try {
        console.log(`Loading questions for course: ${params.id}`)

        try {
          // 尝试从API获取问题
          const courseQuestions = await fetchQuestionsFromBackend(params.id)
          console.log(`Loaded ${courseQuestions.length} questions for course: ${params.id}`)
          setCourseQuestions(courseQuestions)
        } catch (apiError) {
          console.error(`Error loading questions from API for course ${params.id}:`, apiError)

          // 显示错误信息给用户
          setError(`无法从服务器加载问题: ${apiError.message}`)

          // 使用本地问题作为备用
          console.log("Falling back to local questions")
          const localQuestions = questions.filter((q) => q.courseId === params.id)
          setCourseQuestions(localQuestions)
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
        <p className="ml-4 font-pixel">Loading questions...</p>
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
            Back to Home
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

      {error && <div className="text-red-500 mb-4">Error: {error}</div>}

      <div className="grid gap-6">
        {courseQuestions.map((question) => (
          <QuestionCard key={question.id} id={question.id} title={question.title} tokenReward={question.tokenReward} />
        ))}
      </div>
    </div>
  )
}

