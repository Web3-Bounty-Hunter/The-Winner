import type React from "react"
import ClientLayout from "./ClientLayout"
// import PhotonScriptLoader from './components/photon-script-loader'
import { SocketProvider } from './providers/socket-provider'
import OCConnectWrapper from './components/OCConnectWrapper'
import { AuthProvider } from './providers/auth-provider'

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
  const opts = {
    clientId: 'sandbox_mode',
    redirectUri: 'http://localhost:3000/redirect',
    referralCode: 'PARTNER6',
  };

  return (
    <html lang="zh-CN">
      <head>
        {/* 这里可以添加元数据，但不要使用 Head 组件 */}
      </head>
      <body>
        {/* 删除 PhotonScriptLoader */}
        <AuthProvider>
          <SocketProvider>
            <OCConnectWrapper opts={opts} sandboxMode={true}>
              <ClientLayout>{children}</ClientLayout>
            </OCConnectWrapper>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

import './globals.css'