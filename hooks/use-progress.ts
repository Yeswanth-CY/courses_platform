"use client"

import { useState, useCallback } from "react"
import { useUser } from "@/contexts/user-context"
import { useToast } from "@/hooks/use-toast"

interface ProgressData {
  percentage?: number
  timeSpent?: number
  score?: number
  xpGained?: number
}

interface ProgressResponse {
  progress: any
  moduleProgress: any
  courseProgress: any
  totalXpEarned: number
}

export function useProgress() {
  const [isUpdating, setIsUpdating] = useState(false)
  const { user, updateUserProgress } = useUser()
  const { toast } = useToast()

  const trackProgress = useCallback(
    async (
      videoId: string,
      moduleId: string | null,
      courseId: string | null,
      actionType: string,
      progressData: ProgressData = {},
    ): Promise<ProgressResponse | null> => {
      if (!user?.id) {
        console.error("No user logged in")
        return null
      }

      setIsUpdating(true)
      try {
        const response = await fetch("/api/progress/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            videoId,
            moduleId,
            courseId,
            actionType,
            progressData,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to update progress")
        }

        const result = await response.json()

        // Update user's total XP in context
        if (result.totalXpEarned > 0) {
          await updateUserProgress({
            total_xp: user.total_xp + (result.totalXpEarned - (user.total_xp || 0)),
          })
        }

        // Show success toast for significant actions
        if (["video_completed", "quiz_completed", "challenge_completed"].includes(actionType)) {
          toast({
            title: "Progress Saved!",
            description: `Great job! You earned ${progressData.xpGained || 0} XP.`,
          })
        }

        return result
      } catch (error) {
        console.error("Error tracking progress:", error)
        toast({
          title: "Error",
          description: "Failed to save progress. Please try again.",
          variant: "destructive",
        })
        return null
      } finally {
        setIsUpdating(false)
      }
    },
    [user, updateUserProgress, toast],
  )

  const markVideoStarted = useCallback(
    (videoId: string, moduleId: string | null, courseId: string | null) => {
      return trackProgress(videoId, moduleId, courseId, "video_started")
    },
    [trackProgress],
  )

  const updateVideoProgress = useCallback(
    (videoId: string, moduleId: string | null, courseId: string | null, percentage: number, timeSpent: number) => {
      return trackProgress(videoId, moduleId, courseId, "video_progress", { percentage, timeSpent })
    },
    [trackProgress],
  )

  const markVideoCompleted = useCallback(
    (videoId: string, moduleId: string | null, courseId: string | null) => {
      return trackProgress(videoId, moduleId, courseId, "video_completed", { xpGained: 20 })
    },
    [trackProgress],
  )

  const markSectionCompleted = useCallback(
    (videoId: string, moduleId: string | null, courseId: string | null, xpGained = 10) => {
      return trackProgress(videoId, moduleId, courseId, "section_completed", { xpGained })
    },
    [trackProgress],
  )

  const markQuizCompleted = useCallback(
    (videoId: string, moduleId: string | null, courseId: string | null, score: number) => {
      return trackProgress(videoId, moduleId, courseId, "quiz_completed", { score, xpGained: score * 5 })
    },
    [trackProgress],
  )

  const markChallengeCompleted = useCallback(
    (videoId: string, moduleId: string | null, courseId: string | null) => {
      return trackProgress(videoId, moduleId, courseId, "challenge_completed", { xpGained: 25 })
    },
    [trackProgress],
  )

  return {
    isUpdating,
    markVideoStarted,
    updateVideoProgress,
    markVideoCompleted,
    markSectionCompleted,
    markQuizCompleted,
    markChallengeCompleted,
    trackProgress,
  }
}
