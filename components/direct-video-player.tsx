"use client"

import { useState, useEffect, useRef } from "react"
import { useUser } from "@/contexts/user-context"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface DirectVideoPlayerProps {
  videoId: string
  title?: string
  className?: string
  autoPlay?: boolean
  onProgress?: (progress: number) => void
  onComplete?: () => void
}

export function DirectVideoPlayer({
  videoId,
  title,
  className,
  autoPlay = false,
  onProgress,
  onComplete,
}: DirectVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isControlsVisible, setIsControlsVisible] = useState(true)
  const [isBuffering, setIsBuffering] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isTabActive, setIsTabActive] = useState(true)
  const [lastActiveTime, setLastActiveTime] = useState(Date.now())
  const [engagementScore, setEngagementScore] = useState(100)
  const [tabSwitches, setTabSwitches] = useState(0)
  const [watchTime, setWatchTime] = useState(0)
  const [hasAwardedXP, setHasAwardedXP] = useState<Record<number, boolean>>({})

  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const engagementIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const { user } = useUser()

  // Extract video source from YouTube ID
  const getVideoSources = (youtubeId: string) => {
    // For demo purposes, we'll use a proxy service that can fetch YouTube videos
    // In a production app, you would use a proper backend service
    return [
      {
        src: `https://www.youtube.com/embed/${youtubeId}?autoplay=${autoPlay ? 1 : 0}&controls=0&rel=0&showinfo=0&modestbranding=1`,
        type: "video/mp4",
      },
    ]
  }

  // Initialize video player
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleVideoReady = () => {
      setIsLoading(false)
      setDuration(video.duration)
      if (autoPlay) {
        video.play().catch((err) => {
          console.error("Autoplay failed:", err)
          setIsPlaying(false)
        })
      }
    }

    const handleTimeUpdate = () => {
      if (!video) return
      setCurrentTime(video.currentTime)
      const newProgress = (video.currentTime / video.duration) * 100
      setProgress(newProgress)
      onProgress?.(newProgress)

      // Check if video is complete
      if (video.currentTime >= video.duration - 0.5) {
        setIsPlaying(false)
        onComplete?.()
      }
    }

    const handleError = () => {
      setError("Failed to load video. Please try again.")
      setIsLoading(false)
    }

    const handleWaiting = () => {
      setIsBuffering(true)
    }

    const handlePlaying = () => {
      setIsBuffering(false)
    }

    video.addEventListener("loadedmetadata", handleVideoReady)
    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("error", handleError)
    video.addEventListener("waiting", handleWaiting)
    video.addEventListener("playing", handlePlaying)

    return () => {
      video.removeEventListener("loadedmetadata", handleVideoReady)
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("error", handleError)
      video.removeEventListener("waiting", handleWaiting)
      video.removeEventListener("playing", handlePlaying)
    }
  }, [videoId, autoPlay, onProgress, onComplete])

  // Handle tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === "visible"

      if (!isVisible && isTabActive) {
        // User switched away from tab
        setTabSwitches((prev) => prev + 1)
        setIsTabActive(false)
        setLastActiveTime(Date.now())
      } else if (isVisible && !isTabActive) {
        // User returned to tab
        setIsTabActive(true)
        const awayTime = (Date.now() - lastActiveTime) / 1000 // seconds
        if (awayTime > 5) {
          // Penalize engagement score for being away
          setEngagementScore((prev) => Math.max(0, prev - Math.min(20, awayTime / 2)))
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [isTabActive, lastActiveTime])

  // Track engagement metrics
  useEffect(() => {
    engagementIntervalRef.current = setInterval(() => {
      if (isPlaying && isTabActive) {
        // Increase watch time when actively watching
        setWatchTime((prev) => prev + 1)

        // Slowly recover engagement score if actively watching
        setEngagementScore((prev) => Math.min(100, prev + 0.5))

        // Award XP at 2-minute intervals if engagement is good
        const minutes = Math.floor(watchTime / 60)
        if (minutes >= 2 && minutes % 2 === 0 && !hasAwardedXP[minutes] && engagementScore >= 70) {
          awardEngagementXP(minutes, engagementScore)
          setHasAwardedXP((prev) => ({ ...prev, [minutes]: true }))
        }
      }
    }, 1000)

    return () => {
      if (engagementIntervalRef.current) {
        clearInterval(engagementIntervalRef.current)
      }
    }
  }, [isPlaying, isTabActive, watchTime, engagementScore, hasAwardedXP])

  // Handle controls visibility
  useEffect(() => {
    const showControls = () => {
      setIsControlsVisible(true)

      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }

      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setIsControlsVisible(false)
        }
      }, 3000)
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener("mousemove", showControls)
      container.addEventListener("click", showControls)
    }

    return () => {
      if (container) {
        container.removeEventListener("mousemove", showControls)
        container.removeEventListener("click", showControls)
      }

      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [isPlaying])

  // Award XP for engagement
  const awardEngagementXP = async (minutes: number, score: number) => {
    if (!user) return

    try {
      const response = await fetch("/api/progress/engagement-bonus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          videoId,
          watchTimeMinutes: minutes,
          engagementScore: score,
          metrics: {
            tabSwitches,
            actualWatchTime: watchTime,
            videoProgress: progress,
            engagementScore: score,
          },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.xpAwarded > 0) {
          toast({
            title: `+${data.xpAwarded} XP! 🎯`,
            description: `${minutes} minutes of focused learning! (${Math.round(score)}% engagement)`,
            duration: 4000,
          })
        }
      }
    } catch (error) {
      console.error("Error awarding XP:", error)
    }
  }

  // Video playback controls
  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play().catch((err) => {
        console.error("Play failed:", err)
        setError("Playback failed. Please try again.")
      })
    }

    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    video.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current
    if (!video) return

    const newVolume = value[0]
    video.volume = newVolume
    setVolume(newVolume)

    if (newVolume === 0) {
      setIsMuted(true)
      video.muted = true
    } else if (isMuted) {
      setIsMuted(false)
      video.muted = false
    }
  }

  const handleSeek = (value: number[]) => {
    const video = videoRef.current
    if (!video) return

    const seekTime = (value[0] / 100) * duration
    video.currentTime = seekTime
    setCurrentTime(seekTime)
  }

  const toggleFullscreen = () => {
    const container = containerRef.current
    if (!container) return

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }

    setIsFullscreen(!isFullscreen)
  }

  const skipForward = () => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = Math.min(video.duration, video.currentTime + 10)
  }

  const skipBackward = () => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = Math.max(0, video.currentTime - 10)
  }

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  // Use a direct iframe for YouTube videos
  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden bg-black aspect-video", className)}
      onMouseEnter={() => setIsControlsVisible(true)}
      onMouseLeave={() => isPlaying && setIsControlsVisible(false)}
    >
      {/* YouTube iframe */}
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&rel=0&showinfo=0&modestbranding=1`}
        className="absolute inset-0 w-full h-full"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>

      {/* Engagement metrics overlay (top-left corner) */}
      <div className="absolute top-2 left-2 bg-black/80 text-white p-2 rounded text-xs space-y-1 z-10">
        <div>
          Watch: {Math.floor(watchTime / 60)}:{(watchTime % 60).toString().padStart(2, "0")}
        </div>
        <div>Progress: {Math.round(progress)}%</div>
        <div
          className={`font-bold ${
            engagementScore >= 70 ? "text-green-400" : engagementScore >= 40 ? "text-yellow-400" : "text-red-400"
          }`}
        >
          Engagement: {Math.round(engagementScore)}%
        </div>
        {tabSwitches > 0 && <div className="text-orange-400">Tab switches: {tabSwitches}</div>}
      </div>

      {/* Focus warning */}
      {engagementScore < 40 && (
        <div className="absolute bottom-16 left-4 right-4 bg-red-600/90 text-white p-2 rounded text-sm text-center z-10">
          ⚠️ Stay focused to earn XP! Keep the video playing and avoid switching tabs.
        </div>
      )}
    </div>
  )
}
