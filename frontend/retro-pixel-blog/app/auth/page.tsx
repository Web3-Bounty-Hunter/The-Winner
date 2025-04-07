import AuthForm from "../components/auth/auth-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import GlitchEffect from "../components/GlitchEffect"

export default function AuthPage() {
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

      <AuthForm />
    </div>
  )
}

