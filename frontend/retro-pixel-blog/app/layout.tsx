import type React from "react"
import ClientLayout from "./ClientLayout"
// import PhotonScriptLoader from './components/photon-script-loader'
import { SocketProvider } from './providers/socket-provider'

export const metadata = {
  title: "Crypto Quest Casino",
  description: "Learn, play, and earn in our crypto casino",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        {/* 这里可以添加元数据，但不要使用 Head 组件 */}
      </head>
      <body>
        {/* 删除 PhotonScriptLoader */}
        <SocketProvider>
          <ClientLayout>{children}</ClientLayout>
        </SocketProvider>
      </body>
    </html>
  )
}

import './globals.css'