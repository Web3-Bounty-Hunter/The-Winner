'use client'

import { useOCAuth } from '@opencampus/ocid-connect-js';
import { User } from "lucide-react"

const LoginButton = () => {
  const { ocAuth } = useOCAuth();

  const handleLogin = async () => {
    try {
      await ocAuth.signInWithRedirect({ state: 'opencampus' });
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <button className="flex items-center gap-1 px-2 py-1 pixelated-border bg-gray-800 hover:bg-gray-700 rounded transition-colors" onClick={handleLogin}>
      <User size={12} className="text-green-400" />
      <span className="text-green-400 font-squares text-[0.35rem]">Login</span>
    </button>
  )
}

export default LoginButton