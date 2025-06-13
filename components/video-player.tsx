"use client"

import { useState, useEffect, useRef } from "react"
import { Play, ExternalLink, AlertCircle, Loader2, Maximize, X, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoPlayerProps {
  videoUrl: string
  title: string
  course?: string
  topic: string
  summary?: string | null
  className?: string
  isPortrait?: boolean
  autoPlay?: boolean
}

export function VideoPlayer({
  videoUrl,
  title,
  course,
  topic,
  summary,
  className = "",
  isPortrait = false,
  autoPlay = false,
}: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const [showPlayer, setShowPlayer] = useState(autoPlay)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [platform, setPlatform] = useState<string>("")
  const playerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const processVideoUrl = () => {
      try {
        if (!videoUrl || videoUrl.trim() === "") {
          setHasError(true)
          setIsLoading(false)
          return
        }

        let embedUrl = ""
        let detectedPlatform = ""

        // YouTube
        if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
          const videoId = extractYouTubeId(videoUrl)
          if (videoId) {
            const autoplayParam = autoPlay ? "1" : "0"
            const muteParam = isMuted ? "1" : "0"
            embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${autoplayParam}&mute=${muteParam}&rel=0&modestbranding=1&playsinline=1&controls=1&enablejsapi=1`
            detectedPlatform = "YouTube"
          }
        }
        // Vimeo
        else if (videoUrl.includes("vimeo.com")) {
          const videoId = extractVimeoId(videoUrl)
          if (videoId) {
            const autoplayParam = autoPlay ? "1" : "0"
            const muteParam = isMuted ? "1" : "0"
            embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=${autoplayParam}&muted=${muteParam}&title=0&byline=0&portrait=0&responsive=1`
            detectedPlatform = "Vimeo"
          }
        }
        // Loom
        else if (videoUrl.includes("loom.com")) {
          const videoId = extractLoomId(videoUrl)
          if (videoId) {
            embedUrl = `https://www.loom.com/embed/${videoId}`
            detectedPlatform = "Loom"
          }
        }
        // Wistia
        else if (videoUrl.includes("wistia.com") || videoUrl.includes("wi.st")) {
          const videoId = extractWistiaId(videoUrl)
          if (videoId) {
            embedUrl = `https://fast.wistia.net/embed/iframe/${videoId}?autoPlay=${autoPlay ? "true" : "false"}&muted=${isMuted ? "true" : "false"}`
            detectedPlatform = "Wistia"
          }
        }
        // Cloudinary
        else if (videoUrl.includes("cloudinary.com")) {
          // Direct Cloudinary video URL
          embedUrl = videoUrl
          detectedPlatform = "Cloudinary"
        }
        // Direct video files (MP4, WebM, etc.)
        else if (videoUrl.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)) {
          embedUrl = videoUrl
          detectedPlatform = "Direct Video"
        }
        // Streamable
        else if (videoUrl.includes("streamable.com")) {
          const videoId = extractStreamableId(videoUrl)
          if (videoId) {
            embedUrl = `https://streamable.com/e/${videoId}`
            detectedPlatform = "Streamable"
          }
        }
        // JW Player
        else if (videoUrl.includes("jwplatform.com") || videoUrl.includes("jwplayer.com")) {
          // JW Player embed URLs are usually already in embed format
          embedUrl = videoUrl
          detectedPlatform = "JW Player"
        }

        if (embedUrl) {
          setEmbedUrl(embedUrl)
          setPlatform(detectedPlatform)
        } else {
          setHasError(true)
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Error processing video URL:", error)
        setHasError(true)
        setIsLoading(false)
      }
    }

    processVideoUrl()
  }, [videoUrl, autoPlay, isMuted])

  // Helper functions to extract video IDs
  const extractYouTubeId = (url: string) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
    ]
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  const extractVimeoId = (url: string) => {
    const match = url.match(/vimeo\.com\/(?:.*\/)?(\d+)/)
    return match ? match[1] : null
  }

  const extractLoomId = (url: string) => {
    const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/)
    return match ? match[1] : null
  }

  const extractWistiaId = (url: string) => {
    const match = url.match(/(?:wistia\.com\/medias\/|wi\.st\/)([a-zA-Z0-9]+)/)
    return match ? match[1] : null
  }

  const extractStreamableId = (url: string) => {
    const match = url.match(/streamable\.com\/([a-zA-Z0-9]+)/)
    return match ? match[1] : null
  }

  useEffect(() => {
    if (autoPlay) {
      setShowPlayer(true)
      setIsLoading(true)
    }
  }, [autoPlay])

  const handlePlayClick = () => {
    setShowPlayer(true)
    setIsLoading(true)
  }

  const handleFullscreenClick = () => {
    if (!playerRef.current) return

    if (!document.fullscreenElement) {
      if (playerRef.current.requestFullscreen) {
        playerRef.current
          .requestFullscreen()
          .then(() => setIsFullscreen(true))
          .catch((err) => console.error(`Error attempting to enable fullscreen: ${err.message}`))
      }
    } else {
      if (document.exitFullscreen) {
        document
          .exitFullscreen()
          .then(() => setIsFullscreen(false))
          .catch((err) => console.error(`Error attempting to exit fullscreen: ${err.message}`))
      }
    }
  }

  const handleIframeLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const handleIframeError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  const getVideoThumbnail = () => {
    if (!embedUrl) return null

    // Generate thumbnails based on platform
    if (platform === "YouTube") {
      const videoId = extractYouTubeId(videoUrl)
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      }
    } else if (platform === "Vimeo") {
      // Vimeo thumbnails require API call, using placeholder for now
      return `/placeholder.svg?height=720&width=1280&text=Vimeo+Video`
    }

    return `/placeholder.svg?height=720&width=1280&text=${platform}+Video`
  }

  const getPlatformColor = () => {
    switch (platform) {
      case "YouTube":
        return "bg-red-600 hover:bg-red-700"
      case "Vimeo":
        return "bg-blue-600 hover:bg-blue-700"
      case "Loom":
        return "bg-purple-600 hover:bg-purple-700"
      case "Wistia":
        return "bg-green-600 hover:bg-green-700"
      case "Cloudinary":
        return "bg-orange-600 hover:bg-orange-700"
      case "Streamable":
        return "bg-pink-600 hover:bg-pink-700"
      default:
        return "bg-gray-600 hover:bg-gray-700"
    }
  }

  // Portrait mode styling
  const portraitContainerClass = isPortrait
    ? "w-full h-full"
    : "relative w-full h-full bg-gradient-to-br from-gray-900 to-black rounded-lg overflow-hidden"

  return (
    <div
      ref={playerRef}
      className={`${portraitContainerClass} ${className} ${isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""}`}
    >
      {!showPlayer ? (
        // Thumbnail/Preview State
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Video Thumbnail Background */}
          {getVideoThumbnail() && (
            <img
              src={getVideoThumbnail()! || "/placeholder.svg"}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = `/placeholder.svg?height=720&width=1280&text=${platform}+Video`
              }}
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-black/60" />

          <div className="relative z-10 text-center text-white p-6">
            <div className="mb-4">
              <Button
                onClick={handlePlayClick}
                size="lg"
                className={`${
                  isPortrait ? "w-20 h-20" : "w-16 h-16"
                } rounded-full ${getPlatformColor()} transition-all duration-300 hover:scale-110 shadow-lg`}
              >
                <Play className={`${isPortrait ? "w-10 h-10" : "w-8 h-8"} text-white ml-1`} fill="currentColor" />
              </Button>
            </div>

            {!isPortrait && (
              <div className="space-y-2">
                <h3 className="font-bold text-lg line-clamp-2">{title}</h3>
                {course && <p className="text-sm opacity-90">{course}</p>}
                <p className="text-xs opacity-75">{topic}</p>
                {summary && <p className="text-sm opacity-90 line-clamp-2 mt-2">{summary}</p>}
                {platform && <div className="inline-block bg-black/30 px-2 py-1 rounded text-xs">{platform}</div>}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Video Player State
        <>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white z-20">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p className="text-sm">Loading {platform} video...</p>
              </div>
            </div>
          )}

          {hasError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white p-6 z-20">
              <div className="text-center max-w-sm">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                <h3 className="text-lg font-semibold mb-2">Video Unavailable</h3>
                <p className="text-sm text-gray-300 mb-4">
                  This video cannot be embedded. It may be private, restricted, or the URL format is invalid.
                </p>
                <div className="space-y-2">
                  <Button onClick={() => window.open(videoUrl, "_blank")} className={getPlatformColor()}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Original Video
                  </Button>
                  <Button
                    onClick={() => setShowPlayer(false)}
                    variant="outline"
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    Back to Preview
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full relative">
              {embedUrl && (
                <>
                  {platform === "Direct Video" ? (
                    <video
                      className="w-full h-full object-cover"
                      controls
                      autoPlay={autoPlay}
                      muted={isMuted}
                      onLoadedData={handleIframeLoad}
                      onError={handleIframeError}
                    >
                      <source src={embedUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <iframe
                      ref={iframeRef}
                      src={embedUrl}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                      allowFullScreen
                      title={title}
                      onLoad={handleIframeLoad}
                      onError={handleIframeError}
                      style={{
                        minHeight: "100%",
                        aspectRatio: isPortrait ? "9/16" : "16/9",
                      }}
                    />
                  )}
                </>
              )}

              {/* Portrait Mode Controls */}
              {isPortrait && (
                <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
                  <Button
                    onClick={() => setIsMuted(!isMuted)}
                    size="sm"
                    variant="ghost"
                    className="bg-black/40 hover:bg-black/60 text-white rounded-full w-10 h-10 p-0"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>

                  <Button
                    onClick={handleFullscreenClick}
                    size="sm"
                    variant="ghost"
                    className="bg-black/40 hover:bg-black/60 text-white rounded-full w-10 h-10 p-0"
                  >
                    {isFullscreen ? <X className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                  </Button>
                </div>
              )}

              {/* Platform Badge */}
              {platform && (
                <div className="absolute top-4 left-4 z-30">
                  <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 text-white text-xs font-medium">
                    {platform}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Video Info Overlay (only when not playing and not portrait) */}
      {!showPlayer && !isPortrait && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm line-clamp-1">{title}</h3>
              <p className="text-xs opacity-75 line-clamp-1">{topic}</p>
            </div>
            <Button onClick={handlePlayClick} size="sm" className={getPlatformColor()}>
              <Play className="w-3 h-3 mr-1" fill="currentColor" />
              Play
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
