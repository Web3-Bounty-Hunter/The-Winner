"use client"
import type React from "react"
import Link from "next/link"
import { Blocks, Coins, Bitcoin, Image } from "lucide-react"
import { useState, useEffect } from "react"
import { getCourseQuestions } from "../data/courses"
interface CourseCardProps {
  id: string
  title: string
  description: string
  icon: string
}

const CourseCard: React.FC<CourseCardProps> = ({ id, title, description, icon }) => {
  const [questions, setQuestions] = useState<any[]>([]);
  
  // 获取课程相关的题目
  useEffect(() => {
    const courseQuestions = getCourseQuestions(id);
    setQuestions(courseQuestions);
  }, [id]);

  const getIcon = () => {
    switch (icon) {
      case "Coins":
        return <Coins className="w-8 h-8 mb-4" />
      case "Blocks":
        return <Blocks className="w-8 h-8 mb-4" />
      case "Bitcoin":
        return <Bitcoin className="w-8 h-8 mb-4" />
      case "Image":
        return <Image className="w-8 h-8 mb-4" />
      default:
        return <Blocks className="w-8 h-8 mb-4" />
    }
  }

  return (
    <Link
      href={`/course/${id}`}
      className="block p-6 transition-all course-card h-48 relative overflow-hidden"
    >
      <span></span>
      <div className="flex flex-col items-center text-center h-full justify-between py-2">
        {getIcon()}
        <h3
          className="text-xs font-squares mb-3 px-4"
          style={{ fontSize: "0.55rem", letterSpacing: "0.1em", lineHeight: "1.6" }}
        >
          {title}
        </h3>
        <p
          className="font-elvpixels03 text-xs max-w-[90%] mb-2"
          style={{
            fontSize: "0.25rem",
            lineHeight: "1.8",
            letterSpacing: "0.15em",
            wordSpacing: "0.25em",
            minHeight: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {description}
        </p>
        
        {/* 添加滚动题目列表 */}
        <div className="question-scroll-container h-20 overflow-hidden relative">
          <div className="question-scroll animate-scrollUp">
            {questions.map((question, index) => (
              <p
                key={`${question.id}-${index}`}
                className="font-elvpixels03 text-xs py-2"
                style={{
                  fontSize: "0.25rem",
                  lineHeight: "1.8",
                  letterSpacing: "0.15em",
                }}
              >
                {question.title}
              </p>
            ))}
            {/* 复制一份题目实现无缝滚动 */}
            {questions.map((question, index) => (
              <p
                key={`${question.id}-repeat-${index}`}
                className="font-elvpixels03 text-xs py-2"
                style={{
                  fontSize: "0.25rem",
                  lineHeight: "1.8",
                  letterSpacing: "0.15em",
                }}
              >
                {question.title}
              </p>
            ))}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default CourseCard

