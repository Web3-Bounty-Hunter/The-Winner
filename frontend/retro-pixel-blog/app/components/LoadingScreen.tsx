import type React from "react"
import RotatingPokerChip from "./RotatingPokerChip"

interface LoadingScreenProps {
  message?: string
  fullScreen?: boolean
  size?: "small" | "medium" | "large"
  className?: string
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "Loading...",
  fullScreen = false,
  size = "medium",
  className = "",
}) => {
  const chipSizes = {
    small: 40,
    medium: 60,
    large: 100,
  }

  const containerClasses = fullScreen
    ? "fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center"
    : "flex flex-col items-center justify-center py-8"

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="flex flex-col items-center">
        <RotatingPokerChip size={chipSizes[size]} bounce={true} />
        <p className="mt-4 font-elvpixels03 text-center" style={{ fontSize: "0.4rem" }}>
          {message}
        </p>
      </div>
    </div>
  )
}

export default LoadingScreen

