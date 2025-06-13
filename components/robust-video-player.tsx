"use client"

import { useState, useEffect, useRef } from "react"
import { useUser } from "@/contexts/user-context"
import { toast } from "@/hooks/use-toast"
import { Play, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EngagementTracker, type EngagementMetrics } from "@/lib/engagement-tracker"

interface RobustVideoPlayerProps {
  videoUrl: string
  videoId: string
  title?: string
  className?: string
  autoPlay?: boolean
  onEngagementUpdate?: (metrics: EngagementMetrics) => void
  onVideoComplete?: (metrics: EngagementMetrics) => void
}

export function RobustVideoPlayer({
  videoUrl,
  videoId,
  title,
  className,
  autoPlay = false,
  onEngagementUpdate,
  onVideoComplete,
}: RobustVideoPlayerProps) {
  const [playerState, setPlayerState] = useState<"loading" | "ready" | "error" | "blocked">("loading")
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentMetrics, setCurrentMetrics] = useState<EngagementMetrics | null>(null)
  const [hasCompleted, setHasCompleted] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const { user } = useUser()
  const engagementTracker = useRef<EngagementTracker | null>(null)
  const metricsInterval = useRef<NodeJS.Timeout | null>(null)
  const playerContainerId = `robust-player-${videoId}`

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

  // Generate different embed URLs to try
  const getEmbedUrls = (videoId: string) => [
    `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}`,
    `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}`,
    `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}&rel=0&modestbranding=1`,
  ]

  useEffect(() => {
    if (!youtubeId) {
      setPlayerState("error")
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
        checkEngagementMilestones(metrics)
      }
    }, 5000)

    // Try to load YouTube player with fallbacks
    loadYouTubePlayer()

    return () => {
      if (metricsInterval.current) {
        clearInterval(metricsInterval.current)
      }

      if (engagementTracker.current) {
        const finalMetrics = engagementTracker.current.stopTracking()
        console.log("Final engagement metrics:", finalMetrics)
      }
    }
  }, [youtubeId, retryCount])

  const loadYouTubePlayer = async () => {
    if (!youtubeId) return

    try {
      // Load YouTube API if not already loaded
      if (!window.YT) {
        await loadYouTubeAPI()
      }

      // Try different embed approaches
      const embedUrls = getEmbedUrls(youtubeId)
      let playerLoaded = false

      for (let i = 0; i < embedUrls.length && !playerLoaded; i++) {
        try {
          await tryLoadPlayer(embedUrls[i])
          playerLoaded = true
          setPlayerState("ready")
        } catch (error) {
          console.warn(`Failed to load with URL ${i + 1}:`, error)
          if (i === embedUrls.length - 1) {
            // All methods failed, show blocked state
            setPlayerState("blocked")
          }
        }
      }
    } catch (error) {
      console.error("Error loading YouTube player:", error)
      setPlayerState("error")
    }
  }

  const loadYouTubeAPI = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.YT && window.YT.Player) {
        resolve()
        return
      }

      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      tag.onload = () => {
        window.onYouTubeIframeAPIReady = () => resolve()
      }
      tag.onerror = () => reject(new Error("Failed to load YouTube API"))

      const firstScriptTag = document.getElementsByTagName("script")[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    })
  }

  const tryLoadPlayer = (embedUrl: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const player = new window.YT.Player(playerContainerId, {
          videoId: youtubeId,
          playerVars: {
            autoplay: autoPlay ? 1 : 0,
            controls: 1,
            rel: 0,
            modestbranding: 1,
            fs: 1,
            cc_load_policy: 0,
            iv_load_policy: 3,
          },
          events: {
            onReady: () => {
              console.log("YouTube player ready")
              resolve()
            },
            onError: (event: any) => {
              console.error("YouTube player error:", event.data)
              // Error codes: 2 = invalid parameter, 5 = HTML5 player error, 100 = video not found, 101/150 = embedding disabled
              if ([101, 150].includes(event.data)) {
                reject(new Error("Video embedding disabled"))
              } else {
                reject(new Error(`Player error: ${event.data}`))
              }
            },
            onStateChange: (event: any) => {
              handlePlayerStateChange(event)
            },
          },
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  const handlePlayerStateChange = (event: any) => {
    switch (event.data) {
      case window.YT.PlayerState.PLAYING:
        setIsPlaying(true)
        break
      case window.YT.PlayerState.PAUSED:
        setIsPlaying(false)
        break
      case window.YT.PlayerState.ENDED:
        setIsPlaying(false)
        if (!hasCompleted) {
          setHasCompleted(true)
          handleVideoComplete()
        }
        break
    }
  }

  const checkEngagementMilestones = async (metrics: EngagementMetrics) => {
    if (!user) return

    const engagementScore = metrics.engagementScore
    const watchTime = Math.floor(metrics.actualWatchTime / 60)

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

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
    setPlayerState("loading")
  }

  const openInYouTube = () => {
    window.open(videoUrl, "_blank")
  }

  if (playerState === "loading") {
    return (
      <div className={`bg-gray-900 flex items-center justify-center ${className}`}>
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p>Loading video...</p>
        </div>
      </div>
    )
  }

  if (playerState === "blocked") {
    return (
      <div className={`bg-gray-900 flex items-center justify-center p-8 ${className}`}>
        <div className="text-center text-white max-w-md">
          <div className="mb-4">
            <Play className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Video Restricted</h3>
            <p className="text-gray-300 mb-4">
              This video cannot be embedded due to YouTube's restrictions. You can still watch it directly on YouTube.
            </p>
          </div>

          <div className="space-y-3">
            <Button onClick={openInYouTube} className="w-full" variant="default">
              <ExternalLink className="h-4 w-4 mr-2" />
              Watch on YouTube
            </Button>

            <Button onClick={handleRetry} variant="outline" className="w-full">
              Try Again
            </Button>
          </div>

          <div className="mt-4 p-3 bg-blue-900/30 rounded-lg">
            <p className="text-sm text-blue-200">
              💡 <strong>Tip:</strong> You'll still earn XP for watching on YouTube! Just come back here after watching.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (playerState === "error") {
    return (
      <div className={`bg-gray-900 flex items-center justify-center p-8 ${className}`}>
        <div className="text-center text-white">
          <div className="mb-4">
            <div className="h-16 w-16 mx-auto bg-red-500 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Video Error</h3>
            <p className="text-gray-300 mb-4">Unable to load this video</p>
            <p className="text-sm text-gray-400 mb-4">URL: {videoUrl}</p>
          </div>

          <div className="space-y-3">
            <Button onClick={openInYouTube} className="w-full" variant="default">
              <ExternalLink className="h-4 w-4 mr-2" />
              Watch on YouTube
            </Button>

            <Button onClick={handleRetry} variant="outline" className="w-full">
              Try Again
            </Button>
          </div>
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
            className={`font-bold ${
              currentMetrics.engagementScore >= 70
                ? "text-green-400"
                : currentMetrics.engagementScore >= 40
                  ? "text-yellow-400"
                  : "text-red-400"
            }`}
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

      {/* Fallback button for blocked videos */}
      {playerState === "ready" && (
        <Button
          onClick={openInYouTube}
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
