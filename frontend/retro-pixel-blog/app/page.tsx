import { courses } from "./data/courses"
import CourseCard from "./components/CourseCard"
import PixelIcon from "./components/PixelIcon"
import { Blocks, Coins, Bitcoin, Dices, Users } from "lucide-react"
import GlitchEffect from "./components/GlitchEffect"
import Link from "next/link"

export default function Home() {
  // Function to get icon based on course icon name
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Coins":
        return <Coins className="w-6 h-6" />
      case "Blocks":
        return <Blocks className="w-6 h-6" />
      case "Bitcoin":
        return <Bitcoin className="w-6 h-6" />
      default:
        return <Blocks className="w-6 h-6" />
    }
  }

  return (
    <main>
      <div>
        <div className="flex items-center gap-3 mb-8">
          <PixelIcon type="coin" size={20} />
          <h2 className="text-sm font-squares" style={{ fontSize: "0.6rem" }}>
            Courses
          </h2>
        </div>

        <div className="flex justify-center gap-12 mb-12">
          {courses.map((course) => (
            <GlitchEffect key={course.id} triggerOnHover={true}>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 flex items-center justify-center bg-gray-800 rounded-lg mb-4 casino-border">
                  {getIcon(course.icon)}
                </div>
                <span className="font-elvpixels03 text-xs" style={{ fontSize: "0.35rem" }}>
                  {course.title.split(" ")[0]}
                </span>
              </div>
            </GlitchEffect>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              id={course.id}
              title={course.title}
              description={course.description}
              icon={course.icon}
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
  )
}

