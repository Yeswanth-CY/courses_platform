"use client"

import { useState, useCallback } from "react"
import { useUser } from "@/contexts/user-context"
import { useToast } from "@/hooks/use-toast"

export function useRealTimeProgress() {
  const [isTracking, setIsTracking] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const [cooldownRemaining, setCooldownRemaining] = useState<number | null>(null)
  const { user, updateUserData } = useUser()
  const { toast } = useToast()

  const trackVideoWatch = useCallback(
    async (videoId: string, metadata: { completionRate: number; timeSpent: number }) => {
      if (!user || isTracking) return false

      setIsTracking(true)
      setLastError(null)

      try {
        const response = await fetch("/api/progress/track-advanced", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            activityType: "video_watch",
            videoId,
            metadata,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          setLastError(data.error || data.reason || "Failed to track video watch")
          if (data.cooldownRemaining) {
            setCooldownRemaining(data.cooldownRemaining)
          }
          return false
        }

        // Update user data if returned
        if (data.user) {
          updateUserData(data.user)
        }

        // Show notifications
        if (data.notifications) {
          // XP notification
          if (data.notifications.xpGained && data.notifications.xpGained.totalXP > 0) {
            toast({
              title: `+${data.notifications.xpGained.totalXP} XP`,
              description: "Keep watching to earn more!",
              variant: "default",
            })
          }

          // Level up notification
          if (data.notifications.levelUp) {
            toast({
              title: `Level Up! 🎉`,
              description: `You're now level ${data.notifications.levelUp.newLevel}!`,
              variant: "success",
            })
          }

          // Achievement notifications
          if (data.notifications.achievements?.length > 0) {
            data.notifications.achievements.forEach((achievement: any) => {
              toast({
                title: `Achievement Unlocked! 🏆`,
                description: achievement.name,
                variant: "success",
              })
            })
          }

          // Streak notification
          if (data.notifications.streak && data.notifications.streak >= 3) {
            toast({
              title: `${data.notifications.streak}-Day Streak! 🔥`,
              description: "Keep it up for bonus rewards!",
              variant: "default",
            })
          }
        }

        return true
      } catch (error) {
        console.error("Error tracking video watch:", error)
        setLastError("Network error. Please try again.")
        return false
      } finally {
        setIsTracking(false)
      }
    },
    [user, isTracking, toast, updateUserData],
  )

  const trackVideoLike = useCallback(
    async (videoId: string) => {
      if (!user || isTracking) return false

      setIsTracking(true)
      setLastError(null)

      try {
        // First validate if the user can like this video
        const validateResponse = await fetch("/api/user-actions/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            action: "video_like",
            videoId,
            timestamp: Date.now(),
            metadata: {
              source: "like-button",
            },
          }),
        })

        const validateData = await validateResponse.json()

        if (!validateResponse.ok) {
          setLastError(validateData.error || validateData.reason || "Cannot like this video")
          if (validateData.cooldownRemaining) {
            setCooldownRemaining(validateData.cooldownRemaining)
          }

          toast({
            title: "Cannot Like Video",
            description: validateData.reason || "Please watch more of the video before liking",
            variant: "destructive",
          })

          return false
        }

        // If validation passed, track the like for XP
        const response = await fetch("/api/progress/track-advanced", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            activityType: "video_like",
            videoId,
            metadata: {
              source: "like-button",
            },
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          setLastError(data.error || data.reason || "Failed to track video like")
          return false
        }

        // Update user data if returned
        if (data.user) {
          updateUserData(data.user)
        }

        // Show notifications
        if (data.notifications?.xpGained) {
          toast({
            title: `+${data.notifications.xpGained.totalXP} XP`,
            description: "Thanks for liking this video!",
            variant: "default",
          })
        }

        return true
      } catch (error) {
        console.error("Error tracking video like:", error)
        setLastError("Network error. Please try again.")
        return false
      } finally {
        setIsTracking(false)
      }
    },
    [user, isTracking, toast, updateUserData],
  )

  const clearError = useCallback(() => {
    setLastError(null)
    setCooldownRemaining(null)
  }, [])

  return {
    trackVideoWatch,
    trackVideoLike,
    isTracking,
    lastError,
    cooldownRemaining,
    clearError,
  }
}
