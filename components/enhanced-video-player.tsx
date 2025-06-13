"use client"

import { useState, useEffect, useRef } from "react"
import { useUser } from "@/contexts/user-context"
import { toast } from "@/hooks/use-toast"

interface EnhancedVideoPlayerProps {
  videoUrl: string
  videoId: string
  title?: string
  className?: string
  autoPlay?: boolean
  onVideoStart?: () => void
  onVideoProgress?: (progress: number) => void
  onVideoComplete?: () => void
}

export function EnhancedVideoPlayer({
  videoUrl,
  videoId,
  title,
  className,
  autoPlay = false,
  onVideoStart,
  onVideoProgress,
  onVideoComplete,
}: EnhancedVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [watchTime, setWatchTime] = useState(0) // in seconds
  const [lastBonusTime, setLastBonusTime] = useState(0) // in minutes
  const [hasStarted, setHasStarted] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useUser()
  const watchTimeIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const playerContainerId = `youtube-player-${videoId}`

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
    console.log("EnhancedVideoPlayer mounted with videoId:", videoId, "youtubeId:", youtubeId)

    if (!youtubeId) {
      setError("Invalid YouTube URL")
      setIsLoading(false)
      return
    }

    // Create a container for the player if it doesn't exist
    let playerContainer = document.getElementById(playerContainerId)
    if (!playerContainer) {
      playerContainer = document.createElement("div")
      playerContainer.id = playerContainerId
      playerContainer.className = "w-full h-full"

      const parentElement = document.querySelector(`.${className?.split(" ")[0]}`)
      if (parentElement) {
        parentElement.appendChild(playerContainer)
      } else {
        console.error("Could not find parent element for player")
        setError("Could not initialize player")
        setIsLoading(false)
        return
      }
    }

    // Load YouTube API
    if (!window.YT) {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName("script")[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    }

    let player: any
    let isReady = false

    // Initialize player when API is ready
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
                  if (!hasStarted) {
                    setHasStarted(true)
                    onVideoStart?.()
                    trackVideoStart()
                  }

                  // Start tracking watch time
                  if (!watchTimeIntervalRef.current) {
                    watchTimeIntervalRef.current = setInterval(() => {
                      setWatchTime((prev) => {
                        const newWatchTime = prev + 1

                        // Check for 2-minute bonus every 2 minutes
                        const currentMinutes = Math.floor(newWatchTime / 60)
                        const lastBonusMinutes = Math.floor(lastBonusTime)

                        if (currentMinutes >= 2 && currentMinutes > lastBonusMinutes && currentMinutes % 2 === 0) {
                          trackWatchBonus(currentMinutes)
                          setLastBonusTime(currentMinutes)
                        }

                        return newWatchTime
                      })
                    }, 1000)
                  }

                  // Start tracking progress
                  if (!progressIntervalRef.current) {
                    progressIntervalRef.current = setInterval(() => {
                      if (player && isReady) {
                        try {
                          const currentTime = player.getCurrentTime()
                          const videoDuration = player.getDuration()
                          const newProgress = Math.floor((currentTime / videoDuration) * 100)
                          onVideoProgress?.(newProgress)

                          // Track video progress for validation
                          trackVideoProgress(currentTime)
                        } catch (e) {
                          console.error("Error tracking progress:", e)
                        }
                      }
                    }, 5000) // Every 5 seconds
                  }
                }
                // Paused
                else if (event.data === window.YT.PlayerState.PAUSED) {
                  setIsPlaying(false)
                  if (watchTimeIntervalRef.current) {
                    clearInterval(watchTimeIntervalRef.current)
                    watchTimeIntervalRef.current = null
                  }
                }
                // Ended
                else if (event.data === window.YT.PlayerState.ENDED) {
                  setIsPlaying(false)
                  if (!hasCompleted) {
                    setHasCompleted(true)
                    onVideoComplete?.()
                    trackVideoComplete()
                  }
                  if (watchTimeIntervalRef.current) {
                    clearInterval(watchTimeIntervalRef.current)
                    watchTimeIntervalRef.current = null
                  }
                  if (progressIntervalRef.current) {
                    clearInterval(progressIntervalRef.current)
                    progressIntervalRef.current = null
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
      // Define callback for when API is ready
      window.onYouTubeIframeAPIReady = initPlayer
    }

    // Set a timeout to handle cases where the YouTube API doesn't load
    const timeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false)
        setError("Video player failed to load")
      }
    }, 10000)

    return () => {
      if (watchTimeIntervalRef.current) {
        clearInterval(watchTimeIntervalRef.current)
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      clearTimeout(timeout)

      // Clean up player
      if (player && isReady) {
        try {
          player.destroy()
        } catch (e) {
          console.error("Error destroying player:", e)
        }
      }
    }
  }, [youtubeId, autoPlay, videoId, playerContainerId])

  const trackVideoStart = async () => {
    if (!user) return

    try {
      await fetch("/api/users/video-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          videoId,
          action: "progress",
          watchTime: 0,
          completionPercentage: 0,
        }),
      })
    } catch (error) {
      console.error("Error tracking video start:", error)
    }
  }

  const trackVideoProgress = async (currentTime: number) => {
    if (!user) return

    try {
      // Update video progress for like validation
      await fetch("/api/users/video-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          videoId,
          action: "progress",
          watchTime: Math.floor(currentTime),
          completionPercentage: Math.floor((currentTime / 300) * 100), // Assuming 5-minute videos
        }),
      })
    } catch (error) {
      console.error("Error tracking video progress:", error)
    }
  }

  const trackWatchBonus = async (watchTimeMinutes: number) => {
    if (!user) return

    try {
      // Show encouragement toast
      toast({
        title: `+25 XP Bonus!`,
        description: `${watchTimeMinutes} minutes of focused learning! 📚`,
        duration: 3000,
      })
    } catch (error) {
      console.error("Error tracking watch bonus:", error)
    }
  }

  const trackVideoComplete = async () => {
    if (!user) return

    try {
      // Show completion XP toast
      toast({
        title: `Video Completed! +50 XP! 🎯`,
        description: `Great job finishing "${title || "this video"}"!`,
        duration: 4000,
      })
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

  if (!youtubeId) {
    return <div className={`bg-gray-900 flex items-center justify-center ${className}`}>Invalid video URL</div>
  }

  return (
    <div className={`relative ${className}`}>
      <div className="aspect-[9/16] w-full h-full">
        <div id={playerContainerId} className="w-full h-full"></div>
      </div>

      {/* Watch Time Indicator */}
      {watchTime > 0 && (
        <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
          {Math.floor(watchTime / 60)}:{(watchTime % 60).toString().padStart(2, "0")}
        </div>
      )}
    </div>
  )
}
