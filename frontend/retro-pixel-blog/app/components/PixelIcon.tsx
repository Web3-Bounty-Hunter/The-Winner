import type React from "react"
interface PixelIconProps {
  size?: number
  color?: string
  type: "coin" | "check" | "cross"
}

const PixelIcon: React.FC<PixelIconProps> = ({ size = 16, color = "#4ade80", type }) => {
  const coinPattern = [
    [0, 1, 1, 0],
    [1, 1, 1, 1],
    [1, 1, 1, 1],
    [0, 1, 1, 0],
  ]

  const checkPattern = [
    [0, 0, 0, 1],
    [0, 0, 1, 0],
    [1, 1, 0, 0],
    [0, 1, 0, 0],
  ]

  const crossPattern = [
    [1, 0, 0, 1],
    [0, 1, 1, 0],
    [0, 1, 1, 0],
    [1, 0, 0, 1],
  ]

  let pattern
  let iconColor = color

  switch (type) {
    case "coin":
      pattern = coinPattern
      iconColor = "#fbbf24" // yellow
      break
    case "check":
      pattern = checkPattern
      iconColor = "#4ade80" // green
      break
    case "cross":
      pattern = crossPattern
      iconColor = "#ef4444" // red
      break
    default:
      pattern = coinPattern
  }

  const pixelSize = size / pattern.length

  return (
    <div
      className="inline-block"
      style={{
        width: size,
        height: size,
        display: "grid",
        gridTemplateColumns: `repeat(${pattern[0].length}, 1fr)`,
        gridTemplateRows: `repeat(${pattern.length}, 1fr)`,
        gap: "1px",
      }}
    >
      {pattern.flat().map((pixel, i) => (
        <div
          key={i}
          style={{
            backgroundColor: pixel ? iconColor : "transparent",
            width: "100%",
            height: "100%",
          }}
        />
      ))}
    </div>
  )
}

export default PixelIcon

