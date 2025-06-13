"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, AlertTriangle, ExternalLink, Copy, Play, Youtube } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function TroubleshootPage() {
  const [testUrl, setTestUrl] = useState("")
  const [testResult, setTestResult] = useState<{
    status: "success" | "error" | "warning"
    message: string
    embedUrl?: string
    videoId?: string
  } | null>(null)
  const { toast } = useToast()

  const testYouTubeUrl = () => {
    if (!testUrl.trim()) {
      setTestResult({
        status: "error",
        message: "Please enter a YouTube URL to test",
      })
      return
    }

    try {
      // Extract video ID from various YouTube URL formats
      let videoId = ""

      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
        /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
        /youtu\.be\/([^&\n?#]+)/,
      ]

      for (const pattern of patterns) {
        const match = testUrl.match(pattern)
        if (match) {
          videoId = match[1]
          break
        }
      }

      if (videoId) {
        const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&mute=0&rel=0&modestbranding=1&playsinline=1&controls=1&enablejsapi=1`
        setTestResult({
          status: "success",
          message: "YouTube URL format is valid! Video ID extracted successfully.",
          embedUrl,
          videoId,
        })
      } else {
        setTestResult({
          status: "error",
          message: "Could not extract video ID from URL. Please check the YouTube URL format.",
        })
      }
    } catch (error) {
      setTestResult({
        status: "error",
        message: "Invalid URL format",
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "URL copied to clipboard",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <Youtube className="w-8 h-8 text-red-600" />
            YouTube Video Troubleshoot
          </h1>
          <p className="text-gray-600">Test and validate YouTube video URLs for EduBuzzX</p>
        </div>

        {/* Step 1: YouTube URL Requirements */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Step 1: YouTube Video Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <Youtube className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Great Choice!</strong> YouTube videos are much more reliable than Google Drive for embedding.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-green-800 mb-2">✅ Video Requirements:</h4>
                <ul className="text-sm space-y-1">
                  <li>
                    • Video must be <strong>Public</strong> or <strong>Unlisted</strong>
                  </li>
                  <li>• Not set to Private</li>
                  <li>• Embedding must be allowed</li>
                  <li>• No age restrictions</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">🎥 Supported URL Formats:</h4>
                <ul className="text-sm space-y-1">
                  <li>• youtube.com/watch?v=VIDEO_ID</li>
                  <li>• youtu.be/VIDEO_ID</li>
                  <li>• youtube.com/shorts/VIDEO_ID</li>
                  <li>• youtube.com/embed/VIDEO_ID</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: URL Format Checker */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-red-600" />
              Step 2: Test Your YouTube URL
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="test-url">Paste your YouTube video URL here:</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="test-url"
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  className="flex-1"
                />
                <Button onClick={testYouTubeUrl} className="bg-red-600 hover:bg-red-700">
                  <Youtube className="w-4 h-4 mr-2" />
                  Test URL
                </Button>
              </div>
            </div>

            {testResult && (
              <Alert
                className={
                  testResult.status === "success"
                    ? "border-green-200 bg-green-50"
                    : testResult.status === "warning"
                      ? "border-yellow-200 bg-yellow-50"
                      : "border-red-200 bg-red-50"
                }
              >
                <div className="flex items-start gap-2">
                  {testResult.status === "success" && <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />}
                  {testResult.status === "warning" && <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />}
                  {testResult.status === "error" && <XCircle className="w-4 h-4 text-red-600 mt-0.5" />}
                  <div className="flex-1">
                    <AlertDescription
                      className={
                        testResult.status === "success"
                          ? "text-green-800"
                          : testResult.status === "warning"
                            ? "text-yellow-800"
                            : "text-red-800"
                      }
                    >
                      {testResult.message}
                    </AlertDescription>
                    {testResult.embedUrl && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium">
                          Video ID: <code className="bg-gray-100 px-1 rounded">{testResult.videoId}</code>
                        </p>
                        <p className="text-sm font-medium">Generated embed URL:</p>
                        <div className="flex gap-2">
                          <code className="flex-1 bg-gray-100 p-2 rounded text-xs break-all">
                            {testResult.embedUrl}
                          </code>
                          <Button size="sm" variant="outline" onClick={() => copyToClipboard(testResult.embedUrl!)}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => window.open(testResult.embedUrl, "_blank")}
                            className="flex-1"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Test Embed
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => window.open(testUrl, "_blank")}
                            variant="outline"
                            className="flex-1"
                          >
                            <Youtube className="w-4 h-4 mr-2" />
                            Open on YouTube
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Step 3: Common URL Examples */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Step 3: YouTube URL Examples</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-green-800 mb-2">✅ These YouTube URL formats work:</h4>
                <div className="space-y-2 text-sm">
                  <code className="block bg-green-50 p-2 rounded">https://www.youtube.com/watch?v=dQw4w9WgXcQ</code>
                  <code className="block bg-green-50 p-2 rounded">https://youtu.be/dQw4w9WgXcQ</code>
                  <code className="block bg-green-50 p-2 rounded">https://www.youtube.com/shorts/dQw4w9WgXcQ</code>
                  <code className="block bg-green-50 p-2 rounded">https://www.youtube.com/embed/dQw4w9WgXcQ</code>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-red-800 mb-2">❌ These won't work:</h4>
                <div className="space-y-2 text-sm">
                  <code className="block bg-red-50 p-2 rounded">Private videos</code>
                  <code className="block bg-red-50 p-2 rounded">Age-restricted videos</code>
                  <code className="block bg-red-50 p-2 rounded">Videos with embedding disabled</code>
                  <code className="block bg-red-50 p-2 rounded">Playlist URLs (use individual video URLs)</code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 4: Benefits of YouTube */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-600" />
              Step 4: Why YouTube is Better
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-800">
                <strong>YouTube Integration Benefits:</strong> Much more reliable than Google Drive!
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-green-800">🚀 Performance Benefits:</h4>
                <ul className="text-sm space-y-1">
                  <li>• Faster loading and streaming</li>
                  <li>• Better mobile compatibility</li>
                  <li>• Automatic quality adjustment</li>
                  <li>• Built-in player controls</li>
                  <li>• No permission issues</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-800">🎯 Features:</h4>
                <ul className="text-sm space-y-1">
                  <li>• Automatic thumbnails</li>
                  <li>• Fullscreen support</li>
                  <li>• Volume controls</li>
                  <li>• Playback speed options</li>
                  <li>• Captions/subtitles support</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-800 mb-2">🎉 Ready to use YouTube videos?</h4>
              <p className="text-sm text-red-700 mb-3">
                Your EduBuzzX platform now supports YouTube videos! Simply paste any YouTube URL in the admin panel.
              </p>
              <div className="flex gap-2">
                <Button asChild className="bg-red-600 hover:bg-red-700">
                  <a href="/admin">
                    <Youtube className="w-4 h-4 mr-2" />
                    Add YouTube Videos
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/">
                    <Play className="w-4 h-4 mr-2" />
                    View Platform
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
