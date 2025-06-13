"use client"

import type React from "react"

import { useUser } from "@/contexts/user-context"
import { useToast } from "@/hooks/use-toast"

interface ActionTrackerProps {
  children: React.ReactNode
}

export function ActionTracker({ children }: ActionTrackerProps) {
  const { user, refreshUser } = useUser()
  const { toast } = useToast()

  const trackAction = async (
    actionType: "video_like" | "video_watch" | "quiz_complete" | "challenge_complete",
    videoId?: string,
    metadata?: any,
  ) => {
    if (!user) return

    try {
      const response = await fetch("/api/user-actions/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          actionType,
          videoId,
          metadata,
        }),
      })

      if (response.ok) {
        const result = await response.json()

        // Show XP reward notification
        toast({
          title: "Action Tracked!",
          description: result.message,
          duration: 2000,
        })

        // Refresh user data to update XP
        await refreshUser()
      }
    } catch (error) {
      console.error("Error tracking action:", error)
    }
  }

  // Provide the trackAction function to child components
  return <div data-track-action={JSON.stringify({ trackAction })}>{children}</div>
}

// Hook to use action tracking
export function useActionTracker() {
  const { user } = useUser()
  const { toast } = useToast()

  const trackAction = async (
    actionType: "video_like" | "video_watch" | "quiz_complete" | "challenge_complete",
    videoId?: string,
    metadata?: any,
  ) => {
    if (!user) return

    try {
      const response = await fetch("/api/user-actions/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          actionType,
          videoId,
          metadata,
        }),
      })

      if (response.ok) {
        const result = await response.json()

        toast({
          title: "🎉 XP Earned!",
          description: result.message,
          duration: 2000,
        })

        return result
      }
    } catch (error) {
      console.error("Error tracking action:", error)
    }
  }

  return { trackAction }
}
