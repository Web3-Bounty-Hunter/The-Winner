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
  const [courseQuestions, setCourseQuestions] = useState<typeof questions>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const course = courses.find((c) => c.id === params.id)

  useEffect(() => {
    async function loadQuestions() {
      if (!course) return

      setIsLoading(true)
      try {
        console.log(`加载课程题目: ${params.id}`)
        
        // 使用辅助函数获取按难度分配的题目
        const localQuestions = getCourseQuestions(params.id)
        console.log(`加载了 ${localQuestions.length} 道本地题目，课程ID: ${params.id}`)
        setCourseQuestions(localQuestions)
        
        // 如果本地数据为空，显示提示信息
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
        <p className="ml-4 font-pixel">加载题目中...</p>
      </div>
    )
  }

  const handleQuestionClick = (questionId: number) => {
    console.log(`跳转到题目: ${questionId}`)
    router.push(`/question/${questionId}`)
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
            返回主页
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
          课程题目
        </h3>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="grid gap-6">
        {courseQuestions.map((question) => (
          <div 
            key={question.id} 
            className="border border-gray-700 p-4 rounded-md cursor-pointer hover:bg-gray-800 transition-colors"
            onClick={() => handleQuestionClick(question.id)}
          >
            <h3 className="font-bold text-xl mb-2">{question.title}</h3>
            <p className="text-gray-300">{question.question.substring(0, 100)}...</p>
            <div className="flex justify-between mt-2">
              <span className="text-xs bg-blue-900 px-2 py-1 rounded">难度: {question.difficulty}</span>
              <span className="text-xs bg-green-900 px-2 py-1 rounded">奖励: {question.tokenReward}代币</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

