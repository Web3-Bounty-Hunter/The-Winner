"use client"
import { courses } from "./data/courses";
import CourseCard from "./components/CourseCard";
import PixelIcon from "./components/PixelIcon";
import { Blocks, Coins, Bitcoin, Dices, Users } from "lucide-react";
import GlitchEffect from "./components/GlitchEffect";
import Link from "next/link";
import WalletConnect from "../src/app/components/wallet/wallet-connect.tsx";
import LoginButton from './components/LoginButton.jsx';
import React from "react";

export default function Home() {
  // Function to get icon based on course icon name
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Coins":
        return <Coins className="w-6 h-6" />;
      case "Blocks":
        return <Blocks className="w-6 h-6" />;
      case "Bitcoin":
        return <Bitcoin className="w-6 h-6" />;
      default:
        return <Blocks className="w-6 h-6" />;
    }
  };

  // 新增状态来管理当前显示的课程索引
  const [currentCourseIndex, setCurrentCourseIndex] = React.useState(0);

  // 定时更新当前显示的课程
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCourseIndex((prevIndex) => (prevIndex + 1) % courses.length);
    }, 3000); // 每3秒切换一次
    return () => clearInterval(interval);
  }, []);

  return (
    <main>
      <div>
        <div className="flex items-center gap-3 mb-8">
          <PixelIcon type="coin" size={20} />
          <h2 className="text-sm font-squares" style={{ fontSize: "0.6rem" }}>
            Topics
          </h2>
        </div>

        <div className="flex justify-center gap-12 mb-12">
          {courses.map((course, index) => {
            const isCurrent = index === currentCourseIndex;
            const positionOffset = Math.abs(index - currentCourseIndex);
            const scale = 1 - positionOffset * 0.2; // 越远越小
            const opacity = 1 - positionOffset * 0.3; // 越远越透明

            return (
              <GlitchEffect key={course.id} triggerOnHover={true}>
                <div
                  className="flex flex-col items-center transition-transform transition-opacity duration-500"
                  style={{
                    transform: `scale(${scale})`,
                    opacity: opacity,
                  }}
                >
                  <div className="w-16 h-16 flex items-center justify-center bg-gray-800 rounded-lg mb-4 casino-border">
                    {course.title}
                  </div>
                  
                </div>
              </GlitchEffect>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              id={course.id}
              title={course.title}
              description={course.description}
              icon={course.icon}
              topic={course.id} // 传递 topic，值为 course.id
              difficulty={course.difficulty || "medium"} // 传递 difficulty，如果没有则默认 "medium"
            />
          ))}
        </div>

        <div className="mt-12 p-8 bg-gray-800 rounded-lg casino-border">
          <h3 className="text-xs font-squares mb-6 flex items-center gap-3" style={{ fontSize: "0.5rem" }}>
            <Dices className="w-4 h-4 text-purple-400" />
            <span className="font-elvpixels" style={{ fontSize: "0.5rem" }}>
              How It Works
            </span>
          </h3>
          <ul className="font-elvpixels03 space-y-6">
            {[
              "Choose a course topic",
              "Answer questions correctly",
              "Earn tokens for each correct answer",
              "Use tokens to play casino games",
              "Win big and climb the leaderboard!",
            ].map((item, index) => (
              <li key={index} className="flex items-center gap-3">
                <span className="text-purple-400 text-xs">{index + 1}.</span>
                <span style={{ fontSize: "0.4rem", lineHeight: "1.8" }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 p-8 bg-purple-900 rounded-lg casino-border">
          <h3 className="text-xs font-squares mb-6 flex items-center gap-3" style={{ fontSize: "0.5rem" }}>
            <Users className="w-4 h-4 text-purple-300" />
            <span className="font-elvpixels" style={{ fontSize: "0.5rem" }}>
              Multiplayer Quiz
            </span>
          </h3>

          <p className="font-elvpixels03 mb-6" style={{ fontSize: "0.4rem", lineHeight: "1.8" }}>
            Challenge your friends in real-time blockchain knowledge battles!
          </p>

          <GlitchEffect triggerOnHover={true}>
            <Link
              href="/multiplayer"
              className="block w-full p-4 bg-purple-800 rounded-lg text-center hover:bg-purple-700 transition-colors"
            >
              <span className="font-squares" style={{ fontSize: "0.4rem" }}>
                Enter Multiplayer Lobby
              </span>
            </Link>
          </GlitchEffect>
        </div>
      </div>
    </main>
  );
}