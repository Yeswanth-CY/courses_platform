"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Heart, Share, Bookmark, Clock, Flame, Zap, ChevronUp } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/contexts/user-context"
import { YouTubeStreamPlayer } from "@/components/youtube-stream-player"
import { toast } from "@/hooks/use-toast"

interface Video {
  id: string
  title: string
  topic: string
  video_url: string
  summary: string | null
  order_index: number
}

interface Course {
  id: string
  title: string
  description?: string
}

interface Module {
  id: string
  title: string
  description: string | null
  order_index: number
  videos: Video[]
  courses: Course
}

interface ReelsFeedProps {
  modules: Module[]
}

export function ReelsFeed({ modules }: ReelsFeedProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [likes, setLikes] = useState<Record<string, boolean>>({})
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({})
  const [learningTime, setLearningTime] = useState(0)
  const [isLiking, setIsLiking] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const { user, updateUserProgress } = useUser()

  // Flatten all videos from all modules
  const allVideos =
    modules?.flatMap((module) => {
      return (module.videos || []).map((video) => ({
        ...video,
        moduleTitle: module.title || "Untitled Module",
        courseTitle: module.courses?.title || "Untitled Course",
        moduleId: module.id,
      }))
    }) || []

  useEffect(() => {
    console.log("ReelsFeed modules:", modules)
    console.log("All videos:", allVideos)

    // Load user-specific data
    if (user) {
      loadUserVideoData()
    }

    // Start learning timer
    startLearningTimer()

    // Set loading to false after a short delay
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      clearTimeout(timer)
    }
  }, [user, modules])

  const loadUserVideoData = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/users/video-progress?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setLikes(data.likes || {})
        setBookmarks(data.bookmarks || {})
      }
    } catch (error) {
      console.error("Error loading user video data:", error)
    }
  }

  const startLearningTimer = () => {
    timerRef.current = setInterval(() => {
      setLearningTime((prev) => {
        const newTime = prev + 1

        // Update user progress every minute
        if (newTime % 60 === 0 && user) {
          updateUserProgress({
            time_spent: (user.time_spent || 0) + 60,
          })
        }

        return newTime
      })
    }, 1000)
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget
    const scrollTop = container.scrollTop
    const itemHeight = container.clientHeight
    const newIndex = Math.round(scrollTop / itemHeight)

    if (newIndex !== currentVideoIndex && newIndex < allVideos.length) {
      setCurrentVideoIndex(newIndex)
    }
  }

  const handleLike = async (videoId: string) => {
    if (!user || isLiking[videoId]) return

    // Check if already liked
    if (likes[videoId]) {
      toast({
        title: "Already Liked! ❤️",
        description: "You've already liked this video",
        duration: 2000,
      })
      return
    }

    setIsLiking({ ...isLiking, [videoId]: true })

    try {
      // Update UI optimistically
      setLikes({ ...likes, [videoId]: true })

      // Record the like in database first
      const progressResponse = await fetch("/api/users/video-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          videoId,
          action: "like",
          value: true,
        }),
      })

      if (!progressResponse.ok) {
        throw new Error("Failed to record like")
      }

      // Show immediate success feedback
      toast({
        title: `Liked! +15 XP! 💖`,
        description: "Thanks for your feedback!",
        duration: 2000,
      })

      // Try to track XP (but don't fail if this doesn't work)
      try {
        const xpResponse = await fetch("/api/progress/track-advanced", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            activityType: "video_like",
            videoId,
            metadata: {
              source: "reels-feed",
              timestamp: Date.now(),
            },
          }),
        })

        if (xpResponse.ok) {
          const xpData = await xpResponse.json()

          // Update XP display if successful
          if (xpData.xp && xpData.xp.totalXP > 0) {
            toast({
              title: `+${xpData.xp.totalXP} XP Earned! 🎉`,
              description: "Keep engaging to earn more!",
              duration: 3000,
            })
          }

          // Show level up if applicable
          if (xpData.levelUp) {
            setTimeout(() => {
              toast({
                title: `Level Up! 🚀`,
                description: `You've reached level ${xpData.levelUp.newLevel}!`,
                duration: 4000,
              })
            }, 1000)
          }
        }
      } catch (xpError) {
        console.error("XP tracking failed (non-critical):", xpError)
        // Don't show error to user - XP tracking is secondary
      }
    } catch (error) {
      console.error("Error liking video:", error)
      // Revert optimistic update
      setLikes({ ...likes, [videoId]: false })

      toast({
        title: "Error 😔",
        description: "Failed to like video. Please try again.",
        duration: 2000,
      })
    } finally {
      setIsLiking({ ...isLiking, [videoId]: false })
    }
  }

  const handleBookmark = async (videoId: string) => {
    if (!user) return

    const newBookmarks = { ...bookmarks, [videoId]: !bookmarks[videoId] }
    setBookmarks(newBookmarks)

    try {
      await fetch("/api/users/video-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          videoId,
          action: "bookmark",
          value: newBookmarks[videoId],
        }),
      })

      toast({
        title: newBookmarks[videoId] ? "Bookmarked! 📚" : "Removed Bookmark",
        description: newBookmarks[videoId] ? "Added to your saved videos" : "Removed from saved videos",
        duration: 2000,
      })
    } catch (error) {
      console.error("Error updating bookmark:", error)
    }
  }

  const handleShare = (video: any) => {
    if (navigator.share) {
      navigator.share({
        title: video.title || "EduBuzzX Video",
        text: `Check out this ${video.topic || "lesson"} on EduBuzzX!`,
        url: video.video_url || window.location.href,
      })
    } else {
      navigator.clipboard.writeText(video.video_url || window.location.href)
      toast({
        title: "Link Copied! 📋",
        description: "Video link copied to clipboard",
        duration: 2000,
      })
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold">Loading videos...</h2>
        </div>
      </div>
    )
  }

  // No modules available
  if (!modules || modules.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">📱</div>
          <h2 className="text-2xl font-bold mb-2">No Modules Available</h2>
          <p className="text-gray-400 mb-6">Add some courses and videos to start your learning journey!</p>
          <Link
            href="/admin"
            className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Add Content
          </Link>
        </div>
      </div>
    )
  }

  // No videos in modules
  if (allVideos.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">📱</div>
          <h2 className="text-2xl font-bold mb-2">No Videos Available</h2>
          <p className="text-gray-400 mb-6">Add some YouTube videos to your modules!</p>
          <Link
            href="/admin"
            className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Add Videos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-screen bg-black overflow-hidden">
      {/* Learning Stats Header */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-black/50 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-white text-sm font-bold">{user?.current_streak || 0}</span>
          </div>
          <div className="bg-black/50 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-white text-sm font-bold">{user?.total_xp || 0}</span>
          </div>
        </div>

        <div className="bg-black/50 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-2">
          <Clock className="w-4 h-4 text-green-400" />
          <span className="text-white text-sm font-bold">{formatTime(learningTime)}</span>
        </div>
      </div>

      {/* Vertical Scrolling Video Container */}
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        onScroll={handleScroll}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {allVideos.map((video, index) => (
          <div key={video.id} className="relative h-screen w-full snap-start flex items-center justify-center bg-black">
            {/* Portrait Video Container */}
            <div className="relative w-full max-w-sm h-full bg-gray-900 rounded-none overflow-hidden">
              <YouTubeStreamPlayer
                videoUrl={video.video_url}
                videoId={video.id}
                title={video.title || "Untitled Video"}
                className="w-full h-full"
                autoPlay={index === currentVideoIndex}
                onVideoStart={() => console.log("Video started:", video.title)}
                onVideoProgress={(progress) => console.log("Video progress:", progress)}
                onVideoComplete={() => console.log("Video completed:", video.title)}
              />

              {/* Video Overlay Info */}
              <div className="absolute bottom-20 left-4 right-20 text-white z-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-purple-600 text-white border-none">
                      {video.courseTitle}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-lg leading-tight">{video.title || "Untitled Video"}</h3>
                  <p className="text-sm text-gray-300">{video.topic || "General Topic"}</p>

                  {video.summary && (
                    <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed">{video.summary}</p>
                  )}

                  <div className="flex items-center gap-2 mt-3">
                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold">YT</span>
                    </div>
                    <span className="text-sm font-medium">EduBuzzX</span>
                    <span className="text-xs text-gray-400">• YouTube Content</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side Actions (TikTok-style) */}
            <div className="absolute right-4 bottom-20 flex flex-col items-center space-y-6 z-20">
              {/* Like Button */}
              <button
                onClick={() => handleLike(video.id)}
                className="flex flex-col items-center space-y-1"
                disabled={isLiking[video.id]}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    likes[video.id]
                      ? "bg-red-500 text-white"
                      : isLiking[video.id]
                        ? "bg-red-300 text-white"
                        : "bg-black/50 backdrop-blur-md text-white hover:bg-red-500/20"
                  }`}
                >
                  <Heart className={`w-6 h-6 ${likes[video.id] ? "fill-current" : ""}`} />
                </div>
                <span className="text-white text-xs font-medium">{likes[video.id] ? "Liked" : "Like"}</span>
              </button>

              {/* Learn Button */}
              <Link
                href={`/learn?videoId=${video.id}&moduleId=${video.moduleId}`}
                className="flex flex-col items-center space-y-1"
              >
                <div className="w-12 h-12 bg-blue-500 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-all">
                  <ChevronUp className="w-6 h-6" />
                </div>
                <span className="text-white text-xs font-medium">Learn</span>
              </Link>

              {/* Share Button */}
              <button onClick={() => handleShare(video)} className="flex flex-col items-center space-y-1">
                <div className="w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-blue-500/20 transition-all">
                  <Share className="w-6 h-6" />
                </div>
                <span className="text-white text-xs font-medium">Share</span>
              </button>

              {/* Bookmark Button */}
              <button onClick={() => handleBookmark(video.id)} className="flex flex-col items-center space-y-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    bookmarks[video.id]
                      ? "bg-yellow-500 text-white"
                      : "bg-black/50 backdrop-blur-md text-white hover:bg-yellow-500/20"
                  }`}
                >
                  <Bookmark className={`w-6 h-6 ${bookmarks[video.id] ? "fill-current" : ""}`} />
                </div>
                <span className="text-white text-xs font-medium">Save</span>
              </button>
            </div>

            {/* Video Progress Indicator */}
            <div className="absolute bottom-4 left-4 right-4 z-10">
              <div className="flex space-x-1">
                {allVideos.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      i === currentVideoIndex ? "bg-white" : "bg-white/30"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
