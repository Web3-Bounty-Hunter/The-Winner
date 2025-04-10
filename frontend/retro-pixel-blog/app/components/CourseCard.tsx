"use client";
import type React from "react";
import Link from "next/link";
import { Blocks, Coins, Bitcoin, Image } from "lucide-react";
import { useState, useEffect } from "react";
import { getQuestionsByTopicAndDifficulty } from "../data/courses";

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  topic: string;
  difficulty: string;
}

const CourseCard: React.FC<CourseCardProps> = ({ id, title, description, icon, topic, difficulty }) => {
  const [questions, setQuestions] = useState<any[]>([]);

  // 根据主题和难度获取课程相关的题目
  useEffect(() => {
    console.log(`Getting questions for course: ${topic} (${difficulty})`);
    const courseQuestions = getQuestionsByTopicAndDifficulty(topic, difficulty, 10);
    console.log(`Fetched ${courseQuestions.length} questions for ${topic} (${difficulty})`);
    setQuestions(courseQuestions);
  }, [topic, difficulty]);

  const getIcon = () => {
    switch (icon) {
      case "Coins":
        return <Coins className="w-8 h-8 mb-4" />;
      case "Blocks":
        return <Blocks className="w-8 h-8 mb-4" />;
      case "Bitcoin":
        return <Bitcoin className="w-8 h-8 mb-4" />;
      case "Image":
        return <Image className="w-8 h-8 mb-4" />;
      default:
        return <Blocks className="w-8 h-8 mb-4" />;
    }
  };

  return (
    <Link
      href={`/course/${id}`}
      className="block p-6 transition-all course-card h-48 relative overflow-hidden"
    >
      <span></span>
      <div className="flex flex-col items-center text-center h-full justify-start py-2">
        <div className="absolute top-0 left-0 right-0 flex flex-col items-center">
          
          <h3
            className="text-xs font-squares mb-3 px-4"
            style={{ fontSize: "0.55rem", letterSpacing: "0.1em", lineHeight: "1.0", marginBottom: "0.5rem" }}
          >
            {title}
          </h3>
          <p
            className="font-elvpixels03 text-xs max-w-[90%] mb-4"
            style={{
              fontSize: "0.25rem",
              lineHeight: "0.48",
              letterSpacing: "0.45em",
              wordSpacing: "0.65em",
              minHeight: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
           
          </p>
        </div>

        {/* 添加滚动题目列表 */}
        <div className="question-scroll-container h-20 overflow-hidden relative mt-14">
          <div className="question-scroll animate-scrollUp">
            {questions.length > 0 ? (
              questions.map((question, index) => (
                <p
                  key={`${question.id || index}-${index}`} // 确保 key 唯一，edu 题目可能没有 id
                  className="font-elvpixels03 text-xs py-2 text-effect"
                  style={{
                    fontSize: "0.25rem",
                    lineHeight: "1.8",
                    letterSpacing: "0.15em",
                  }}
                >
                  {question.title || question.question || "Untitled Question"}
                </p>
              ))
            ) : (
              <p
                className="font-elvpixels03 text-xs py-2 text-effect"
                style={{
                  fontSize: "0.25rem",
                  lineHeight: "1.8",
                  letterSpacing: "0.15em",
                }}
              >
                No questions available
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;