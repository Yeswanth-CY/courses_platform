"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LogIn, ArrowRight, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useUser } from "@/contexts/user-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface User {
  id: string
  name: string
  avatar_color: string
  total_xp: number
  current_streak: number
  videos_watched: number
}

export default function LoginPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [setupRequired, setSetupRequired] = useState(false)
  const router = useRouter()
  const { setUser } = useUser()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      const data = await response.json()

      if (!response.ok) {
        if (data.setupRequired) {
          setSetupRequired(true)
          setError("Database setup required. Please run the setup scripts.")
        } else {
          setError(data.error || "Failed to fetch users")
        }
        return
      }

      setUsers(data)
    } catch (error) {
      console.error("Error fetching users:", error)
      setError("Failed to connect to the server")
    } finally {
      setLoading(false)
    }
  }

  const handleUserSelect = async (user: User) => {
    try {
      // Store user data in localStorage and context
      localStorage.setItem("eduBuzzX_currentUser", JSON.stringify(user))

      // Update the user context
      setUser(user)

      // Update last active
      await fetch("/api/users/update-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      })

      // Small delay to ensure state is updated
      setTimeout(() => {
        router.push("/")
      }, 100)
    } catch (error) {
      console.error("Login error:", error)
    }
  }

  const handleSetupDatabase = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/setup-database", {
        method: "POST",
      })

      if (response.ok) {
        // Refresh users after setup
        await fetchUsers()
        setSetupRequired(false)
        setError(null)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to set up database")
      }
    } catch (error) {
      console.error("Setup error:", error)
      setError("Failed to set up database")
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading profiles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <Card className="w-full max-w-md bg-white shadow-2xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to EduBuzzX</h1>
            <p className="text-gray-600">Select your profile to continue learning</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>

              {setupRequired && (
                <Button
                  onClick={handleSetupDatabase}
                  className="w-full mt-4 bg-red-600 hover:bg-red-700"
                  disabled={loading}
                >
                  {loading ? "Setting up..." : "Run Database Setup"}
                </Button>
              )}
            </Alert>
          )}

          {users.length > 0 ? (
            <div className="space-y-3">
              {users.map((user) => (
                <Button
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  variant="outline"
                  className="w-full h-16 flex items-center justify-between p-4 hover:bg-purple-50 hover:border-purple-300 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: user.avatar_color }}
                    >
                      {getInitials(user.name)}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">
                        {user.videos_watched > 0 ? "Continue Learning" : "Start Learning"}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </Button>
              ))}
            </div>
          ) : (
            !error && (
              <div className="text-center py-8">
                <p className="text-gray-500">No user profiles found</p>
                <Button onClick={handleSetupDatabase} className="mt-4" disabled={loading}>
                  {loading ? "Setting up..." : "Create Default Profiles"}
                </Button>
              </div>
            )
          )}

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">Your progress is automatically saved and synced across sessions</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
