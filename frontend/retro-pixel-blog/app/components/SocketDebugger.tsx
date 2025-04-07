"use client"

import { useSocket } from "../providers/socket-provider"
import { useState, useEffect } from "react"

export default function SocketDebugger() {
  const { socketClient, isConnected } = useSocket()
  const [events, setEvents] = useState<{event: string, data: any, time: Date}[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!socketClient) return;
    
    let debounceTimer: NodeJS.Timeout | null = null;
    let eventQueue: {event: string, data: any, time: Date}[] = [];
    
    const handleAnyEvent = (event: string, ...args: any[]) => {
      eventQueue.push({
        event,
        data: args[0],
        time: new Date()
      });
      
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      
      debounceTimer = setTimeout(() => {
        setEvents(prev => [...prev.slice(-19), ...eventQueue]);
        eventQueue = [];
      }, 300);
    }

    socketClient.onAny(handleAnyEvent)

    return () => {
      socketClient.offAny(handleAnyEvent)
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    }
  }, [socketClient])

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-black border border-green-500 text-green-500 px-2 py-1 text-xs"
      >
        调试
      </button>
    )
  }

  return (
    <div className="fixed bottom-0 right-0 w-96 h-64 bg-black/90 border border-green-500 text-green-500 text-xs overflow-auto">
      <div className="flex justify-between p-2 border-b border-green-500">
        <h3>Socket调试 ({isConnected ? '已连接' : '未连接'})</h3>
        <button onClick={() => setIsVisible(false)}>关闭</button>
      </div>
      <div className="p-2">
        {events.map((e, i) => (
          <div key={i} className="mb-1">
            <span className="text-yellow-500">{e.time.toLocaleTimeString()}</span>
            <span className="text-white ml-2">{e.event}</span>
            <pre className="text-green-300 text-xs mt-1 overflow-x-auto">
              {JSON.stringify(e.data, null, 1).substring(0, 200)}
              {JSON.stringify(e.data, null, 1).length > 200 ? '...' : ''}
            </pre>
          </div>
        ))}
      </div>
    </div>
  )
} 