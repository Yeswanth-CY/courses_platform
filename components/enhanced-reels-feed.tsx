"use client"

import { useState, useEffect } from "react"
import { Heart, Bookmark, Share2, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RobustVideoPlayer } from "./robust-video-player"
import { useUser } from "@/contexts/user-context"
import { toast } from "@/hooks/use-toast"
import type { EngagementMetrics } from "@/lib/engagement-tracker"

interface Video {
  id: string
  title: string
  description: string
  video_url: string
  thumbnail_url?: string
  likes_count: number
  views_count: number
  created_at: string
}

export function EnhancedReelsFeed() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set())
  const [bookmarkedVideos, setBookmarkedVideos] = useState<Set<string>>(new Set())
  const { user } = useUser()

  useEffect(() => {
    fetchVideos()
    if (user) {
      fetchUserInteractions()
    }
  }, [user])

  const fetchVideos = async () => {
    try {
      const response = await fetch("/api/videos")
      if (!response.ok) throw new Error("Failed to fetch videos")

      const data = await response.json()
      console.log("Fetched videos:", data)

      if (Array.isArray(data)) {
        setVideos(data)
      } else if (data.videos && Array.isArray(data.videos)) {
        setVideos(data.videos)
      } else {
        console.error("Unexpected video data format:", data)
        setError("Invalid video data format")
      }
    } catch (err) {
      console.error("Error fetching videos:", err)
      setError("Failed to load videos")
    } finally {
      setLoading(false)
    }
  }

  const fetchUserInteractions = async () => {
    if (!user) return

    try {
      // Fetch user's liked videos
      const likesResponse = await fetch(`/api/users/${user.id}/likes`)
      if (likesResponse.ok) {
        const likesData = await likesResponse.json()
        setLikedVideos(new Set(likesData.likedVideoIds || []))
      }

      // Fetch user's bookmarked videos
      const bookmarksResponse = await fetch(`/api/users/${user.id}/bookmarks`)
      if (bookmarksResponse.ok) {
        const bookmarksData = await bookmarksResponse.json()
        setBookmarkedVideos(new Set(bookmarksData.bookmarkedVideoIds || []))
      }
    } catch (error) {
      console.error("Error fetching user interactions:", error)
    }
  }

  const handleLike = async (videoId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to like videos",
        variant: "destructive",
      })
      return
    }

    const isLiked = likedVideos.has(videoId)

    // Optimistic update
    const newLikedVideos = new Set(likedVideos)
    if (isLiked) {
      newLikedVideos.delete(videoId)
    } else {
      newLikedVideos.add(videoId)
    }
    setLikedVideos(newLikedVideos)

    // Update video likes count optimistically
    setVideos((prev) =>
      prev.map((video) =>
        video.id === videoId ? { ...video, likes_count: video.likes_count + (isLiked ? -1 : 1) } : video,
      ),
    )

    try {
      const response = await fetch("/api/user-actions/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          action: "video_like",
          videoId,
          metadata: { liked: !isLiked },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to track like")
      }

      const data = await response.json()

      if (data.xpAwarded > 0) {
        toast({
          title: `+${data.xpAwarded} XP!`,
          description: isLiked ? "Video unliked" : "Thanks for the like! ❤️",
          duration: 2000,
        })
      }
    } catch (error) {
      console.error("Error tracking like:", error)
      // Revert optimistic update on error
      setLikedVideos(likedVideos)
      setVideos((prev) =>
        prev.map((video) =>
          video.id === videoId ? { ...video, likes_count: video.likes_count + (isLiked ? 1 : -1) } : video,
        ),
      )
    }
  }

  const handleBookmark = async (videoId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to bookmark videos",
        variant: "destructive",
      })
      return
    }

    const isBookmarked = bookmarkedVideos.has(videoId)

    // Optimistic update
    const newBookmarkedVideos = new Set(bookmarkedVideos)
    if (isBookmarked) {
      newBookmarkedVideos.delete(videoId)
    } else {
      newBookmarkedVideos.add(videoId)
    }
    setBookmarkedVideos(newBookmarkedVideos)

    try {
      const response = await fetch("/api/user-actions/bookmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          videoId,
          bookmarked: !isBookmarked,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to bookmark video")
      }

      toast({
        title: isBookmarked ? "Bookmark Removed" : "Video Bookmarked!",
        description: isBookmarked ? "Removed from your bookmarks" : "Added to your bookmarks 📚",
        duration: 2000,
      })
    } catch (error) {
      console.error("Error bookmarking video:", error)
      // Revert optimistic update on error
      setBookmarkedVideos(bookmarkedVideos)
    }
  }

  const handleEngagementUpdate = (videoId: string, metrics: EngagementMetrics) => {
    // You can use this to show real-time engagement feedback
    console.log(`Video ${videoId} engagement:`, metrics)
  }

  const handleVideoComplete = (videoId: string, metrics: EngagementMetrics) => {
    console.log(`Video ${videoId} completed with metrics:`, metrics)

    // Show engagement summary
    if (metrics.engagementScore >= 80) {
      toast({
        title: "Excellent Focus! 🎯",
        description: `${Math.round(metrics.engagementScore)}% engagement score`,
        duration: 4000,
      })
    } else if (metrics.engagementScore >= 60) {
      toast({
        title: "Good Focus! 👍",
        description: `${Math.round(metrics.engagementScore)}% engagement score`,
        duration: 3000,
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center">
          <p className="text-xl mb-4">😕 {error}</p>
          <Button onClick={fetchVideos} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center">
          <p className="text-xl mb-4">📹 No videos available</p>
          <p className="text-gray-400">Check back later for new content!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-black min-h-screen">
      <div className="max-w-md mx-auto">
        {videos.map((video, index) => (
          <div key={video.id} className="relative h-screen flex flex-col">
            {/* Video Player */}
            <div className="flex-1 relative">
              <RobustVideoPlayer
                videoUrl={video.video_url}
                videoId={video.id}
                title={video.title}
                className="w-full h-full"
                autoPlay={index === 0}
                onEngagementUpdate={(metrics) => handleEngagementUpdate(video.id, metrics)}
                onVideoComplete={(metrics) => handleVideoComplete(video.id, metrics)}
              />

              {/* Video Info Overlay */}
              <div className="absolute bottom-20 left-4 right-16 text-white">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">{video.title}</h3>
                <p className="text-sm text-gray-300 line-clamp-3 mb-2">{video.description}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-400">
                  <span>{video.views_count} views</span>
                  <span>{video.likes_count} likes</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="absolute right-4 bottom-20 flex flex-col space-y-4">
              <Button
                variant="ghost"
                size="sm"
                className={`rounded-full p-3 ${
                  likedVideos.has(video.id) ? "bg-red-500 text-white" : "bg-black/50 text-white hover:bg-black/70"
                }`}
                onClick={() => handleLike(video.id)}
              >
                <Heart className={`h-6 w-6 ${likedVideos.has(video.id) ? "fill-current" : ""}`} />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className={`rounded-full p-3 ${
                  bookmarkedVideos.has(video.id)
                    ? "bg-yellow-500 text-white"
                    : "bg-black/50 text-white hover:bg-black/70"
                }`}
                onClick={() => handleBookmark(video.id)}
              >
                <Bookmark className={`h-6 w-6 ${bookmarkedVideos.has(video.id) ? "fill-current" : ""}`} />
              </Button>

              <Button variant="ghost" size="sm" className="rounded-full p-3 bg-black/50 text-white hover:bg-black/70">
                <MessageCircle className="h-6 w-6" />
              </Button>

              <Button variant="ghost" size="sm" className="rounded-full p-3 bg-black/50 text-white hover:bg-black/70">
                <Share2 className="h-6 w-6" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
