import type React from "react"
import Link from "next/link"
import { Blocks, Coins, Bitcoin, Image } from "lucide-react"
import GlitchEffect from "./GlitchEffect"

interface CourseCardProps {
  id: string
  title: string
  description: string
  icon: string
}

const CourseCard: React.FC<CourseCardProps> = ({ id, title, description, icon }) => {
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
    <GlitchEffect triggerOnHover={true}>
      <Link
        href={`/course/${id}`}
        className="block p-6 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors casino-border h-48"
      >
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
        </div>
      </Link>
    </GlitchEffect>
  )
}

export default CourseCard

