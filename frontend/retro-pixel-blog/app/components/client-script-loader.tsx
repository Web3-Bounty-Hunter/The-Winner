"use client"

import { useEffect, useRef, useState } from 'react'

interface ClientScriptLoaderProps {
  scriptUrl?: string
}

export default function ClientScriptLoader({ scriptUrl = "/scripts/client.js" }: ClientScriptLoaderProps) {
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const scriptRef = useRef<HTMLScriptElement | null>(null)
  
  useEffect(() => {
    // 确保 scriptUrl 有值
    if (!scriptUrl) {
      console.error("脚本 URL 未定义")
      return
    }
    
    if (scriptRef.current) return
    
    const script = document.createElement('script')
    script.src = scriptUrl
    script.async = true
    script.onload = () => {
      console.log(`脚本加载成功: ${scriptUrl}`)
      setScriptLoaded(true)
    }
    script.onerror = () => {
      console.error(`脚本加载失败: ${scriptUrl}`)
    }
    
    document.head.appendChild(script)
    scriptRef.current = script
    
    return () => {
      if (scriptRef.current && document.head.contains(scriptRef.current)) {
        try {
          document.head.removeChild(scriptRef.current)
        } catch (e) {
          console.error("移除脚本节点失败", e)
        }
        scriptRef.current = null
      }
    }
  }, [scriptUrl])
  
  return null
} 