import { cn } from "@/lib/utils"

interface AceIconProps {
  size?: number
  color?: string
  suit?: "spades" | "hearts" | "diamonds" | "clubs"
  className?: string
  pixelated?: boolean
}

export default function AceIcon({
  size = 24,
  color = "currentColor",
  suit = "spades",
  className,
  pixelated = true,
}: AceIconProps) {
  // SVG paths for different suits
  const suitPaths = {
    spades: "M12 2L8 10H16L12 2ZM8 10C8 12.2 9.8 14 12 14C14.2 14 16 12.2 16 10H8ZM12 14V22M9 19H15",
    hearts:
      "M12 6C12 3.8 10.2 2 8 2C5.8 2 4 3.8 4 6C4 10 12 14 12 14C12 14 20 10 20 6C20 3.8 18.2 2 16 2C13.8 2 12 3.8 12 6ZM12 14V22M9 19H15",
    diamonds: "M12 2L6 12L12 22L18 12L12 2ZM12 14V22M9 19H15",
    clubs:
      "M12 2C9.8 2 8 3.8 8 6C8 7.3 8.6 8.4 9.5 9C8.6 9.4 8 10.2 8 11C8 12.1 8.9 13 10 13H14C15.1 13 16 12.1 16 11C16 10.2 15.4 9.4 14.5 9C15.4 8.4 16 7.3 16 6C16 3.8 14.2 2 12 2ZM12 13V22M9 19H15",
  }

  // Pixel rendering style
  const renderStyle = pixelated
    ? {
        imageRendering: "pixelated" as const,
        shapeRendering: "crispEdges" as const,
      }
    : {}

  return (
    <div className={cn("inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
        style={renderStyle}
        className="ace-icon"
      >
        {/* Card outline */}
        <rect x="2" y="2" width="20" height="20" rx="2" strokeWidth="1.5" />

        {/* A letter */}
        <text
          x="7"
          y="9"
          fontSize="6"
          fill={color}
          stroke="none"
          style={{ fontFamily: "monospace", fontWeight: "bold" }}
        >
          A
        </text>

        {/* Suit in corner */}
        <path
          d={suitPaths[suit]}
          transform="scale(0.3) translate(48, 4)"
          fill={suit === "hearts" || suit === "diamonds" ? color : "none"}
          stroke={suit === "hearts" || suit === "diamonds" ? "none" : color}
        />

        {/* Center suit */}
        <path
          d={suitPaths[suit]}
          transform="scale(0.8) translate(3, 3)"
          fill={suit === "hearts" || suit === "diamonds" ? color : "none"}
          stroke={suit === "hearts" || suit === "diamonds" ? "none" : color}
        />
      </svg>
    </div>
  )
}
