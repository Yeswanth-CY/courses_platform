"use client"

import { useState, useEffect, useRef } from "react"
import { useUser } from "@/contexts/user-context"
import { toast } from "@/hooks/use-toast"
import { EngagementTracker, type EngagementMetrics } from "@/lib/engagement-tracker"

interface EngagementVideoPlayerProps {
  videoUrl: string
  videoId: string
  title?: string
  className?: string
  autoPlay?: boolean
  onEngagementUpdate?: (metrics: EngagementMetrics) => void
  onVideoComplete?: (metrics: EngagementMetrics) => void
}

export function EngagementVideoPlayer({
  videoUrl,
  videoId,
  title,
  className,
  autoPlay = false,
  onEngagementUpdate,
  onVideoComplete,
}: EngagementVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentMetrics, setCurrentMetrics] = useState<EngagementMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasCompleted, setHasCompleted] = useState(false)

  const { user } = useUser()
  const engagementTracker = useRef<EngagementTracker | null>(null)
  const metricsInterval = useRef<NodeJS.Timeout | null>(null)
  const playerContainerId = `engagement-player-${videoId}`

  // Extract YouTube video ID
  const getYouTubeId = (url: string) => {
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
      const match = url.match(regExp)
      return match && match[2].length === 11 ? match[2] : null
    } catch (e) {
      console.error("Error extracting YouTube ID:", e)
      return null
    }
  }

  const youtubeId = getYouTubeId(videoUrl)

  useEffect(() => {
    if (!youtubeId) {
      setError("Invalid YouTube URL")
      setIsLoading(false)
      return
    }

    // Initialize engagement tracker
    engagementTracker.current = new EngagementTracker()
    engagementTracker.current.startTracking()

    // Start metrics update interval
    metricsInterval.current = setInterval(() => {
      if (engagementTracker.current) {
        const metrics = engagementTracker.current.getCurrentMetrics()
        setCurrentMetrics(metrics)
        onEngagementUpdate?.(metrics)

        // Award XP based on engagement milestones
        checkEngagementMilestones(metrics)
      }
    }, 5000) // Update every 5 seconds

    // Load YouTube API
    if (!window.YT) {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName("script")[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    }

    let player: any
    let isReady = false

    const initPlayer = () => {
      if (window.YT && window.YT.Player) {
        try {
          player = new window.YT.Player(playerContainerId, {
            videoId: youtubeId,
            playerVars: {
              autoplay: autoPlay ? 1 : 0,
              controls: 1,
              rel: 0,
              modestbranding: 1,
            },
            events: {
              onReady: () => {
                console.log("YouTube player ready")
                isReady = true
                setIsLoading(false)
              },
              onError: (e: any) => {
                console.error("YouTube player error:", e)
                setError("Error loading video")
                setIsLoading(false)
              },
              onStateChange: (event: any) => {
                // Playing
                if (event.data === window.YT.PlayerState.PLAYING) {
                  setIsPlaying(true)
                }
                // Paused
                else if (event.data === window.YT.PlayerState.PAUSED) {
                  setIsPlaying(false)
                }
                // Ended
                else if (event.data === window.YT.PlayerState.ENDED) {
                  setIsPlaying(false)
                  if (!hasCompleted) {
                    setHasCompleted(true)
                    handleVideoComplete()
                  }
                }
              },
            },
          })
        } catch (e) {
          console.error("Error initializing YouTube player:", e)
          setError("Could not initialize player")
          setIsLoading(false)
        }
      }
    }

    // Handle YouTube API loading
    if (window.YT && window.YT.Player) {
      initPlayer()
    } else {
      window.onYouTubeIframeAPIReady = initPlayer
    }

    return () => {
      if (metricsInterval.current) {
        clearInterval(metricsInterval.current)
      }

      if (engagementTracker.current) {
        const finalMetrics = engagementTracker.current.stopTracking()
        console.log("Final engagement metrics:", finalMetrics)
      }

      if (player && isReady) {
        try {
          player.destroy()
        } catch (e) {
          console.error("Error destroying player:", e)
        }
      }
    }
  }, [youtubeId, autoPlay, videoId])

  const checkEngagementMilestones = async (metrics: EngagementMetrics) => {
    if (!user) return

    // Award XP for high engagement milestones
    const engagementScore = metrics.engagementScore
    const watchTime = Math.floor(metrics.actualWatchTime / 60) // in minutes

    // Every 2 minutes of actual watch time with good engagement
    if (watchTime >= 2 && watchTime % 2 === 0 && engagementScore >= 70) {
      await awardEngagementXP(watchTime, engagementScore, metrics)
    }
  }

  const awardEngagementXP = async (watchTimeMinutes: number, engagementScore: number, metrics: EngagementMetrics) => {
    if (!user) return

    try {
      const response = await fetch("/api/progress/engagement-bonus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          videoId,
          watchTimeMinutes,
          engagementScore,
          metrics,
        }),
      })

      if (response.ok) {
        const data = await response.json()

        if (data.xpAwarded > 0) {
          toast({
            title: `+${data.xpAwarded} XP! 🎯`,
            description: `${watchTimeMinutes} minutes of focused learning! (${Math.round(engagementScore)}% engagement)`,
            duration: 4000,
          })
        }
      }
    } catch (error) {
      console.error("Error awarding engagement XP:", error)
    }
  }

  const handleVideoComplete = async () => {
    if (!user || !engagementTracker.current) return

    const finalMetrics = engagementTracker.current.getCurrentMetrics()

    try {
      const response = await fetch("/api/progress/video-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          videoId,
          metrics: finalMetrics,
        }),
      })

      if (response.ok) {
        const data = await response.json()

        // Show completion toast with engagement score
        toast({
          title: `Video Completed! +${data.xpAwarded} XP! 🎉`,
          description: `Engagement Score: ${Math.round(finalMetrics.engagementScore)}%`,
          duration: 5000,
        })

        onVideoComplete?.(finalMetrics)
      }
    } catch (error) {
      console.error("Error tracking video completion:", error)
    }
  }

  if (isLoading) {
    return (
      <div className={`bg-gray-900 flex items-center justify-center ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-gray-900 flex items-center justify-center ${className}`}>
        <div className="text-center text-white">
          <p className="mb-2">{error}</p>
          <p className="text-sm text-gray-400">URL: {videoUrl}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div className="aspect-[9/16] w-full h-full">
        <div id={playerContainerId} className="w-full h-full"></div>
      </div>

      {/* Engagement Metrics Overlay */}
      {currentMetrics && (
        <div className="absolute top-2 left-2 bg-black/80 text-white p-2 rounded text-xs space-y-1">
          <div>
            Watch: {Math.floor(currentMetrics.actualWatchTime / 60)}:
            {Math.floor(currentMetrics.actualWatchTime % 60)
              .toString()
              .padStart(2, "0")}
          </div>
          <div>Progress: {Math.round(currentMetrics.videoProgress)}%</div>
          <div
            className={`font-bold ${currentMetrics.engagementScore >= 70 ? "text-green-400" : currentMetrics.engagementScore >= 40 ? "text-yellow-400" : "text-red-400"}`}
          >
            Engagement: {Math.round(currentMetrics.engagementScore)}%
          </div>
          {currentMetrics.tabSwitches > 0 && (
            <div className="text-orange-400">Tab switches: {currentMetrics.tabSwitches}</div>
          )}
        </div>
      )}

      {/* Focus Warning */}
      {currentMetrics && currentMetrics.engagementScore < 40 && (
        <div className="absolute bottom-4 left-4 right-4 bg-red-600/90 text-white p-2 rounded text-sm text-center">
          ⚠️ Stay focused to earn XP! Keep the video playing and avoid switching tabs.
        </div>
      )}
    </div>
  )
}
