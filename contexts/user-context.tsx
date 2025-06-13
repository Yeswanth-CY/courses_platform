"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  id: string
  name: string
  avatar_color: string
  total_xp: number
  current_streak: number
  best_streak: number
  videos_watched: number
  time_spent: number
  last_active: string
}

interface UserContextType {
  user: User | null
  setUser: (user: User | null) => void
  updateUserProgress: (updates: Partial<User>) => Promise<void>
  isLoggedIn: boolean
  logout: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Load user from localStorage on mount
    const initializeUser = () => {
      try {
        const storedUser = localStorage.getItem("eduBuzzX_currentUser")
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          setUser(userData)
          // Refresh user data from server
          refreshUserData(userData.id)
        }
      } catch (error) {
        console.error("Error parsing stored user:", error)
        localStorage.removeItem("eduBuzzX_currentUser")
      } finally {
        setIsInitialized(true)
      }
    }

    initializeUser()
  }, [])

  const refreshUserData = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/by-id?id=${userId}`)
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        localStorage.setItem("eduBuzzX_currentUser", JSON.stringify(userData))
      }
    } catch (error) {
      console.error("Error refreshing user data:", error)
    }
  }

  const updateUserProgress = async (updates: Partial<User>) => {
    if (!user) return

    try {
      const response = await fetch("/api/users/update-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, ...updates }),
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setUser(updatedUser)
        localStorage.setItem("eduBuzzX_currentUser", JSON.stringify(updatedUser))
      }
    } catch (error) {
      console.error("Error updating user progress:", error)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("eduBuzzX_currentUser")
  }

  return (
    <UserContext.Provider
      value={{
        user,
        setUser: (newUser) => {
          setUser(newUser)
          if (newUser) {
            localStorage.setItem("eduBuzzX_currentUser", JSON.stringify(newUser))
          } else {
            localStorage.removeItem("eduBuzzX_currentUser")
          }
        },
        updateUserProgress,
        isLoggedIn: !!user && isInitialized,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
