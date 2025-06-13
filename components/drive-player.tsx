"use client"

import { useState, useEffect, useRef } from "react"
import { Play, ExternalLink, AlertCircle, Loader2, Maximize, X, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DrivePlayerProps {
  driveUrl: string
  title: string
  course?: string
  topic: string
  summary?: string | null
  className?: string
  isPortrait?: boolean
  autoPlay?: boolean
}

export function DrivePlayer({
  driveUrl,
  title,
  course,
  topic,
  summary,
  className = "",
  isPortrait = false,
  autoPlay = false,
}: DrivePlayerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const [showPlayer, setShowPlayer] = useState(autoPlay)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const playerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const processUrl = () => {
      try {
        if (!driveUrl || driveUrl.trim() === "") {
          setHasError(true)
          setIsLoading(false)
          return
        }

        let fileId = ""

        // Extract file ID from various Google Drive URL formats
        const viewMatch = driveUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/)
        if (viewMatch) {
          fileId = viewMatch[1]
        }

        const openMatch = driveUrl.match(/[?&]id=([a-zA-Z0-9-_]+)/)
        if (openMatch) {
          fileId = openMatch[1]
        }

        if (fileId) {
          // Use preview URL with autoplay for portrait mode
          const autoplayParam = autoPlay ? "&autoplay=1" : ""
          const newEmbedUrl = `https://drive.google.com/file/d/${fileId}/preview?usp=sharing${autoplayParam}`
          setEmbedUrl(newEmbedUrl)
        } else {
          // If we can't extract file ID, try to use the URL as-is if it looks valid
          if (driveUrl.includes("drive.google.com")) {
            setEmbedUrl(driveUrl)
          } else {
            setHasError(true)
            setIsLoading(false)
          }
        }
      } catch (error) {
        console.error("Error processing URL:", error)
        setHasError(true)
        setIsLoading(false)
      }
    }

    processUrl()
  }, [driveUrl, autoPlay])

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
          <div
            className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-blue-900/20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          <div className="relative z-10 text-center text-white p-6">
            <div className="mb-4">
              <Button
                onClick={handlePlayClick}
                size="lg"
                className={`${
                  isPortrait ? "w-20 h-20" : "w-16 h-16"
                } rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 transition-all duration-300 hover:scale-110`}
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
                <p className="text-sm">Loading video...</p>
              </div>
            </div>
          )}

          {!embedUrl && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white z-20">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p className="text-sm">Preparing video...</p>
              </div>
            </div>
          )}

          {hasError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white p-6 z-20">
              <div className="text-center max-w-sm">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                <h3 className="text-lg font-semibold mb-2">Video Unavailable</h3>
                <p className="text-sm text-gray-300 mb-4">
                  This video cannot be embedded. It may be private or have restricted sharing settings.
                </p>
                <div className="space-y-2">
                  <Button
                    onClick={() => window.open(driveUrl, "_blank")}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in Google Drive
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
                <iframe
                  ref={iframeRef}
                  src={embedUrl}
                  className="w-full h-full border-0"
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                  allowFullScreen
                  title={title}
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
                  style={{
                    minHeight: "100%",
                    aspectRatio: isPortrait ? "9/16" : "16/9",
                  }}
                />
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

              {/* Desktop controls overlay */}
              {!isPortrait && (
                <div
                  className={`absolute top-4 right-4 z-30 transition-opacity duration-300 ${
                    isFullscreen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
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
            <Button
              onClick={handlePlayClick}
              size="sm"
              className="ml-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30"
            >
              <Play className="w-3 h-3 mr-1" fill="currentColor" />
              Play
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
