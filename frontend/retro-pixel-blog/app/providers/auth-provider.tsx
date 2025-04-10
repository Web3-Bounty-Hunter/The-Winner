"use client"

import { createContext, useContext, useState } from 'react'

interface User {
  id: string
  username: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (username: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  login: () => {},
  logout: () => {}
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>({
    id: 'mock-user-id',
    username: '玩家1'
  })
  const [isLoading, setIsLoading] = useState(false)

  const login = (username: string) => {
    setUser({
      id: 'mock-user-id',
      username
    })
  }

  const logout = () => {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)