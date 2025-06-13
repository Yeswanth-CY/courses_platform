"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useUser } from "@/contexts/user-context"
import { Loader2 } from "lucide-react"

interface AuthWrapperProps {
  children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, isLoggedIn } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)

  useEffect(() => {
    // Allow access to login page without authentication
    if (pathname === "/login") {
      setIsLoading(false)
      setHasCheckedAuth(true)
      return
    }

    // Only check auth once to prevent loops
    if (!hasCheckedAuth) {
      const timer = setTimeout(() => {
        if (!isLoggedIn) {
          router.push("/login")
        } else {
          setIsLoading(false)
        }
        setHasCheckedAuth(true)
      }, 500)

      return () => clearTimeout(timer)
    } else if (isLoggedIn) {
      setIsLoading(false)
    }
  }, [isLoggedIn, router, pathname, hasCheckedAuth])

  // Show loading screen while checking authentication
  if (isLoading && pathname !== "/login") {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-600" />
            <div className="absolute inset-0 bg-purple-100 rounded-full animate-ping opacity-20"></div>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Loading EduBuzzX</h2>
          <p className="text-gray-400">Preparing your learning experience...</p>
          {user && (
            <div className="mt-4 bg-white/10 backdrop-blur-md rounded-lg p-3 inline-block">
              <p className="text-white text-sm">Welcome back!</p>
              <p className="text-purple-300 font-medium">Hello {user.name}! Ready to continue learning?</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
