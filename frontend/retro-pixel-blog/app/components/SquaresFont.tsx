"use client"

import { useEffect } from "react"

const SquaresFont = () => {
  useEffect(() => {
    // Add a style element to force extremely small font sizes
    const style = document.createElement("style")
    style.textContent = `
    .font-squares {
      font-family: 'Squares', monospace !important;
      font-size: 0.5rem !important;
      line-height: 2.1 !important;
      letter-spacing: 0.05em !important;
      word-spacing: 0.1em !important;
    }
    
    h1.font-squares {
      font-size: 0.7rem !important;
      line-height: 3.2 !important;
      letter-spacing: 0.03em !important;
    }
    
    h2.font-squares {
      font-size: 0.6rem !important;
      line-height: 2.2 !important;
      letter-spacing: 0.04em !important;
    }
    
    h3.font-squares {
      font-size: 0.55rem !important;
      line-height: 4.2 !important;
      letter-spacing: 0.04em !important;
    }
    
    p.font-squares, span.font-squares, div.font-squares, li.font-squares {
      font-size: 0.45rem !important;
      line-height: 2.8 !important;
      letter-spacing: 0.05em !important;
    }
    
    button.font-squares, a.font-squares {
      font-size: 0.4rem !important;
      line-height: 2.8 !important;
      letter-spacing: 0.05em !important;
    }
    
    /* Scale down all text elements */
    .font-squares * {
      transform: scale(0.8);
      transform-origin: left top;
      letter-spacing: inherit;
      line-height: inherit;
    }
  `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return null
}

export default SquaresFont

