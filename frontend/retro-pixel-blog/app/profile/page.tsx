"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../context/auth-context"
import UserProfile from "../components/user-profile"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import GlitchEffect from "../components/GlitchEffect"

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-pixel">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <GlitchEffect triggerOnHover={true}>
          <Link
            href="/"
            className="pixelated-border p-3 bg-gray-800 hover:bg-gray-700 transition-colors font-squares text-xs"
            style={{ fontSize: "0.35rem" }}
          >
            <div className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </div>
          </Link>
        </GlitchEffect>
      </div>

      <UserProfile />
    </div>
  )
}

