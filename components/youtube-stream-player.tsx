"use client"

import { useState, useEffect, useRef } from "react"
import { useUser } from "@/contexts/user-context"
import { toast } from "@/hooks/use-toast"
import { RotateCcw, ExternalLink } from "lucide-react"

interface YouTubeStreamPlayerProps {
  videoUrl: string
  videoId: string
  title?: string
  className?: string
  autoPlay?: boolean
  onVideoStart?: () => void
  onVideoProgress?: (progress: number) => void
  onVideoComplete?: () => void
}

export function YouTubeStreamPlayer({
  videoUrl,
  videoId,
  title,
  className,
  autoPlay = false,
  onVideoStart,
  onVideoProgress,
  onVideoComplete,
}: YouTubeStreamPlayerProps) {
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(70)
  const [isMuted, setIsMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [showFallback, setShowFallback] = useState(false)

  // Engagement tracking
  const [watchTime, setWatchTime] = useState(0)
  const [isTabActive, setIsTabActive] = useState(true)
  const [tabSwitches, setTabSwitches] = useState(0)
  const [engagementScore, setEngagementScore] = useState(100)
  const [lastActiveTime, setLastActiveTime] = useState(Date.now())

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const engagementRef = useRef<NodeJS.Timeout | null>(null)
  const { user } = useUser()

  // Extract YouTube video ID from URL
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  const youtubeId = getYouTubeId(videoUrl)

  useEffect(() => {
    if (!youtubeId) {
      setError("Invalid YouTube URL")
      setIsLoading(false)
      return
    }

    // Try to load the video
    loadVideo()

    // Start engagement tracking
    startEngagementTracking()

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (engagementRef.current) clearInterval(engagementRef.current)
    }
  }, [youtubeId])

  const loadVideo = () => {
    setIsLoading(false)
    setIsReady(true)

    // Start progress simulation (since we can't access iframe internals)
    if (autoPlay) {
      setIsPlaying(true)
      startProgressTracking()
    }
  }

  const startProgressTracking = () => {
    intervalRef.current = setInterval(() => {
      if (isPlaying) {
        setCurrentTime((prev) => {
          const newTime = prev + 1
          const newProgress = duration > 0 ? (newTime / duration) * 100 : 0
          setProgress(newProgress)
          onVideoProgress?.(newProgress)

          // Complete video when reaching 95%
          if (newProgress >= 95 && newProgress < 96) {
            onVideoComplete?.()
            handleVideoComplete()
          }

          return newTime
        })
      }
    }, 1000)
  }

  const startEngagementTracking = () => {
    // Set estimated duration (you can get this from YouTube API if needed)
    setDuration(600) // 10 minutes default

    engagementRef.current = setInterval(() => {
      if (isPlaying && isTabActive) {
        setWatchTime((prev) => prev + 1)

        // Slowly recover engagement score when actively watching
        setEngagementScore((prev) => Math.min(100, prev + 0.5))

        // Award XP every 2 minutes of focused watching
        if (watchTime > 0 && watchTime % 120 === 0 && engagementScore >= 70) {
          awardEngagementXP()
        }
      }
    }, 1000)
  }

  // Tab visibility tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === "visible"

      if (!isVisible && isTabActive) {
        setTabSwitches((prev) => prev + 1)
        setIsTabActive(false)
        setLastActiveTime(Date.now())
      } else if (isVisible && !isTabActive) {
        setIsTabActive(true)
        const awayTime = (Date.now() - lastActiveTime) / 1000
        if (awayTime > 5) {
          setEngagementScore((prev) => Math.max(0, prev - Math.min(20, awayTime / 2)))
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [isTabActive, lastActiveTime])

  const awardEngagementXP = async () => {
    if (!user) return

    try {
      const response = await fetch("/api/user-actions/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          action: "video_watch",
          videoId,
          metadata: {
            watchTimeMinutes: Math.floor(watchTime / 60),
            engagementScore,
            tabSwitches,
            source: "reels-feed",
          },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.xpAwarded > 0) {
          toast({
            title: `+${data.xpAwarded} XP! 🎯`,
            description: `${Math.floor(watchTime / 60)} minutes of focused learning!`,
            duration: 3000,
          })
        }
      }
    } catch (error) {
      console.error("Error awarding XP:", error)
    }
  }

  const handleVideoComplete = async () => {
    if (!user) return

    try {
      const response = await fetch("/api/user-actions/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          action: "video_complete",
          videoId,
          metadata: {
            watchTime,
            engagementScore,
            tabSwitches,
            completed: true,
          },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: `Video Completed! +${data.xpAwarded} XP! 🎉`,
          description: `Engagement Score: ${Math.round(engagementScore)}%`,
          duration: 5000,
        })

        if (data.levelUp) {
          setTimeout(() => {
            toast({
              title: `Level Up! 🚀`,
              description: `You've reached level ${data.levelUp.newLevel}!`,
              duration: 4000,
            })
          }, 1000)
        }
      }
    } catch (error) {
      console.error("Error tracking completion:", error)
    }
  }

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
    if (!isPlaying) {
      onVideoStart?.()
      startProgressTracking()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  const embedUrl = youtubeId
    ? `https://www.youtube.com/embed/${youtubeId}?autoplay=${autoPlay ? 1 : 0}&controls=1&rel=0&modestbranding=1`
    : ""

  if (error || !youtubeId) {
    return (
      <div className={`bg-gray-900 flex items-center justify-center p-8 ${className}`}>
        <div className="text-center text-white">
          <div className="mb-4">
            <RotateCcw className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Video Error</h3>
            <p className="text-gray-300 mb-4">{error || "Invalid video URL"}</p>
          </div>
          <button
            onClick={() => window.open(videoUrl, "_blank")}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2 mx-auto"
          >
            <ExternalLink className="h-4 w-4" />
            Watch on YouTube
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={`bg-gray-900 flex items-center justify-center ${className}`}>
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p>Loading video...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative bg-black ${className}`}>
      {/* YouTube Embed */}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        className="w-full h-full"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onLoad={() => {
          setIsReady(true)
          setIsLoading(false)
        }}
        onError={() => {
          setError("Failed to load video")
          setShowFallback(true)
        }}
      />

      {/* Fallback for blocked videos */}
      {showFallback && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-20">
          <div className="text-center text-white p-8">
            <h3 className="text-xl font-semibold mb-4">Video Restricted</h3>
            <p className="text-gray-300 mb-6">This video cannot be embedded. Watch it directly on YouTube.</p>
            <button
              onClick={() => window.open(videoUrl, "_blank")}
              className="px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2 mx-auto"
            >
              <ExternalLink className="h-5 w-5" />
              Open in YouTube
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
