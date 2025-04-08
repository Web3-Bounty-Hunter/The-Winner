"use client"

import { useEffect } from "react"

const ElvPixelsFont = () => {
  useEffect(() => {
    // Add a style element to ensure ElvPixels fonts are properly loaded
    const style = document.createElement("style")
    style.textContent = `
      @font-face {
        font-family: 'ElvPixels';
        src: url('https://thelasthobbit.github.io/MyFonts/Elv_Pixels_02.woff2') format('woff2');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
      
      @font-face {
        font-family: 'ElvPixels03';
        src: url('https://thelasthobbit.github.io/MyFonts/Elv_Pixels_03.woff2') format('woff2');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
      
      .font-elvpixels {
        font-family: 'ElvPixels', monospace !important;
        font-size: 0.5rem !important;
        line-height: 2.2 !important;
      }
      
      .font-elvpixels03 {
        font-family: 'ElvPixels03', monospace !important;
        font-size: 0.4rem !important;
        line-height: 3 !important;
      }
      
      /* Fix overlapping text by adjusting line height and font size */
      .font-elvpixels03 p, .font-elvpixels03 span, .font-elvpixels03 div {
        line-height: 3 !important;
        font-size: 0.4rem !important;
        letter-spacing: 0.1em;
      }
      
      /* Keep buttons with their original font */
      button, .btn, [role="button"] {
        font-family: 'Squares', monospace !important;
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return null
}

export default ElvPixelsFont

