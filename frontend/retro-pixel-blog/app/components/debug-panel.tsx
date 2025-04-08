"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"

export default function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const maxLogs = 20 // Limit the number of logs

  useEffect(() => {
    if (!isOpen) return // Only capture logs when panel is open

    // 拦截 console.log 和 console.error
    const originalLog = console.log
    const originalError = console.error

    console.log = (...args) => {
      originalLog(...args)
      if (isOpen) {
        setLogs((prev) =>
          [...prev, `LOG: ${args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : arg)).join(" ")}`].slice(
            -maxLogs,
          ),
        ) // Keep only the most recent logs
      }
    }

    console.error = (...args) => {
      originalError(...args)
      if (isOpen) {
        setLogs((prev) =>
          [
            ...prev,
            `ERROR: ${args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : arg)).join(" ")}`,
          ].slice(-maxLogs),
        )
      }
    }

    return () => {
      console.log = originalLog
      console.error = originalError
    }
  }, [isOpen, maxLogs])

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-50 bg-red-600 text-white px-3 py-1 rounded-md font-mono text-xs"
      >
        Debug
      </button>
    )
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 text-white font-mono text-xs h-64 overflow-auto">
      <div className="flex justify-between items-center p-2 border-b border-gray-700 sticky top-0 bg-gray-900">
        <h3>Debug Console</h3>
        <button onClick={() => setIsOpen(false)}>
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-2">
        {logs.length === 0 ? (
          <p className="text-gray-500">No logs yet...</p>
        ) : (
          logs.map((log, i) => (
            <div key={i} className={`mb-1 ${log.startsWith("ERROR") ? "text-red-400" : "text-green-400"}`}>
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

