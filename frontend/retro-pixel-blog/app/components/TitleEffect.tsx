"use client"
import NeonEffect from "./NeonEffect"
import AceIcon from "./AceIcon"
import { cn } from "@/lib/utils"

interface NeonAceTitleProps {
  title: string
  subtitle?: string
  color?: "blue" | "red" | "green" | "purple" | "gold"
  suit?: "spades" | "hearts" | "diamonds" | "clubs"
  className?: string
  iconSize?: number
}

export default function NeonAceTitle({
  title,
  subtitle,
  color = "purple",
  suit = "spades",
  className,
  iconSize = 32,
}: NeonAceTitleProps) {
  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <div className="flex items-center gap-3 mb-2">
        <NeonEffect color={color} intensity="high" pulse={true}>
          <AceIcon
            size={iconSize}
            suit={suit}
            color={
              color === "blue"
                ? "#00AAFF"
                : color === "red"
                  ? "#FF0066"
                  : color === "green"
                    ? "#00FF80"
                    : color === "purple"
                      ? "#9933FF"
                      : color === "gold"
                        ? "#FFD700"
                        : "currentColor"
            }
          />
        </NeonEffect>

        <NeonEffect color={color} intensity="high">
          <h1 className="font-squares text-1xl tracking-wider">{title}</h1>
        </NeonEffect>

        <NeonEffect color={color} intensity="high" pulse={true}>
          <AceIcon
            size={iconSize}
            suit={suit}
            color={
              color === "blue"
                ? "#00AAFF"
                : color === "red"
                  ? "#FF0066"
                  : color === "green"
                    ? "#00FF80"
                    : color === "purple"
                      ? "#9933FF"
                      : color === "gold"
                        ? "#FFD700"
                        : "currentColor"
            }
          />
        </NeonEffect>
      </div>

      {subtitle && (
        <NeonEffect color={color} intensity="low">
          <p className="font-elvpixels03 text-sm opacity-80">{subtitle}</p>
        </NeonEffect>
      )}
    </div>
  )
}
