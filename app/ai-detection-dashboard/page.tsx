"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Brain, Loader2, Sparkles, BarChart3, RefreshCw, Eye } from "lucide-react"
import Link from "next/link"

interface Video {
  id: string
  title: string
  topic: string
  summary: string
  programming_language: string | null
  content_type: string | null
  ai_detection_result: any
  module: {
    title: string
    course: {
      title: string
      primary_language: string | null
    }
  }
}

interface DetectionStats {
  total: number
  processed: number
  withLanguage: number
  withoutLanguage: number
  highConfidence: number
  mediumConfidence: number
  lowConfidence: number
}

export default function AIDetectionDashboard() {
  const [videos, setVideos] = useState<Video[]>([])
  const [stats, setStats] = useState<DetectionStats>({
    total: 0,
    processed: 0,
    withLanguage: 0,
    withoutLanguage: 0,
    highConfidence: 0,
    mediumConfidence: 0,
    lowConfidence: 0,
  })
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [processProgress, setProcessProgress] = useState(0)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("videos")
        .select(`
          id, 
          title, 
          topic, 
          summary,
          programming_language,
          content_type,
          ai_detection_result,
          module:modules(
            title, 
            course:courses(
              title, 
              primary_language
            )
          )
        `)
        .order("title")

      if (data) {
        setVideos(data)
        calculateStats(data)
      }
    } catch (error) {
      console.error("Error fetching videos:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (videoData: Video[]) => {
    const total = videoData.length
    const processed = videoData.filter((v) => v.ai_detection_result).length
    const withLanguage = videoData.filter((v) => v.programming_language).length
    const withoutLanguage = total - withLanguage

    const highConfidence = videoData.filter((v) => v.ai_detection_result?.confidence === "high").length
    const mediumConfidence = videoData.filter((v) => v.ai_detection_result?.confidence === "medium").length
    const lowConfidence = videoData.filter((v) => v.ai_detection_result?.confidence === "low").length

    setStats({
      total,
      processed,
      withLanguage,
      withoutLanguage,
      highConfidence,
      mediumConfidence,
      lowConfidence,
    })
  }

  const runAIDetection = async () => {
    setProcessing(true)
    setProcessProgress(0)

    try {
      const response = await fetch("/api/ai-language-detection?processAll=true")
      const result = await response.json()

      if (result.processed) {
        setProcessProgress(100)
        await fetchVideos() // Refresh data

        // Show success message
        alert(
          `AI Detection Complete!\nProcessed: ${result.processed}\nUpdated: ${result.updated}\nFailed: ${result.failed}`,
        )
      }
    } catch (error) {
      console.error("Error running AI detection:", error)
      alert("AI detection failed. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  const detectSingleVideo = async (videoId: string) => {
    try {
      const response = await fetch(`/api/ai-language-detection?videoId=${videoId}`)
      const result = await response.json()

      if (result.detectedLanguage !== undefined) {
        await fetchVideos() // Refresh data
        alert(
          `Detection complete for video!\nLanguage: ${result.detectedLanguage || "None"}\nConfidence: ${result.confidence}`,
        )
      }
    } catch (error) {
      console.error("Error detecting single video:", error)
      alert("Detection failed. Please try again.")
    }
  }

  const getLanguageBadgeColor = (language: string | null) => {
    if (!language) return "bg-gray-100 text-gray-800"

    switch (language.toLowerCase()) {
      case "python":
        return "bg-blue-100 text-blue-800"
      case "javascript":
        return "bg-yellow-100 text-yellow-800"
      case "java":
        return "bg-orange-100 text-orange-800"
      case "typescript":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-purple-100 text-purple-800"
    }
  }

  const getConfidenceBadgeColor = (confidence: string) => {
    switch (confidence) {
      case "high":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-gray-600">Loading AI detection dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <Brain className="w-8 h-8 text-purple-600" />
          AI Language Detection Dashboard
        </h1>
        <p className="text-gray-600">
          Intelligent programming language detection powered by AI - no hardcoded patterns!
        </p>
      </div>

      {/* AI Detection Control Panel */}
      <Card className="mb-8 border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Detection Control Panel
          </CardTitle>
          <CardDescription>
            Run AI-powered language detection on all videos to replace any hardcoded assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button onClick={runAIDetection} disabled={processing} className="flex items-center gap-2">
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  Run AI Detection on All Videos
                </>
              )}
            </Button>
            <Button variant="outline" onClick={fetchVideos}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </div>
          {processing && (
            <div className="mt-4">
              <Progress value={processProgress} className="w-full" />
              <p className="text-sm text-gray-600 mt-2">Processing videos with AI...</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detected">AI Detected ({stats.withLanguage})</TabsTrigger>
          <TabsTrigger value="undetected">Undetected ({stats.withoutLanguage})</TabsTrigger>
          <TabsTrigger value="all">All Videos ({stats.total})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Videos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">AI Processed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.processed}</div>
                <p className="text-xs text-gray-500">
                  {stats.total > 0 ? Math.round((stats.processed / stats.total) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Language Detected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.withLanguage}</div>
                <p className="text-xs text-gray-500">
                  {stats.total > 0 ? Math.round((stats.withLanguage / stats.total) * 100) : 0}% success rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">High Confidence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.highConfidence}</div>
                <p className="text-xs text-gray-500">AI is very confident</p>
              </CardContent>
            </Card>
          </div>

          {/* Detection Quality Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                AI Detection Quality Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">High Confidence</span>
                  <div className="flex items-center gap-2">
                    <Progress value={(stats.highConfidence / stats.total) * 100} className="w-32" />
                    <span className="text-sm text-gray-600">{stats.highConfidence}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Medium Confidence</span>
                  <div className="flex items-center gap-2">
                    <Progress value={(stats.mediumConfidence / stats.total) * 100} className="w-32" />
                    <span className="text-sm text-gray-600">{stats.mediumConfidence}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Low Confidence</span>
                  <div className="flex items-center gap-2">
                    <Progress value={(stats.lowConfidence / stats.total) * 100} className="w-32" />
                    <span className="text-sm text-gray-600">{stats.lowConfidence}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Detection Info */}
          <Alert>
            <Brain className="h-4 w-4" />
            <AlertTitle>AI-Powered Detection</AlertTitle>
            <AlertDescription>
              This system uses Google's Gemini AI to analyze video metadata and intelligently detect programming
              languages. No hardcoded patterns or rules - everything is determined by AI based on context, course
              information, and content analysis.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="detected" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {videos
              .filter((v) => v.programming_language)
              .map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onDetect={detectSingleVideo}
                  getLanguageBadgeColor={getLanguageBadgeColor}
                  getConfidenceBadgeColor={getConfidenceBadgeColor}
                />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="undetected" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {videos
              .filter((v) => !v.programming_language)
              .map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onDetect={detectSingleVideo}
                  getLanguageBadgeColor={getLanguageBadgeColor}
                  getConfidenceBadgeColor={getConfidenceBadgeColor}
                />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="all" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onDetect={detectSingleVideo}
                getLanguageBadgeColor={getLanguageBadgeColor}
                getConfidenceBadgeColor={getConfidenceBadgeColor}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface VideoCardProps {
  video: Video
  onDetect: (videoId: string) => void
  getLanguageBadgeColor: (language: string | null) => string
  getConfidenceBadgeColor: (confidence: string) => string
}

function VideoCard({ video, onDetect, getLanguageBadgeColor, getConfidenceBadgeColor }: VideoCardProps) {
  return (
    <Card className={video.programming_language ? "border-green-200" : "border-gray-200"}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{video.title}</CardTitle>
          <div className="flex gap-2">
            {video.programming_language ? (
              <Badge className={getLanguageBadgeColor(video.programming_language)}>{video.programming_language}</Badge>
            ) : (
              <Badge variant="outline" className="bg-red-50 text-red-700">
                No Language
              </Badge>
            )}
            {video.ai_detection_result?.confidence && (
              <Badge className={getConfidenceBadgeColor(video.ai_detection_result.confidence)}>
                {video.ai_detection_result.confidence}
              </Badge>
            )}
          </div>
        </div>
        <CardDescription className="line-clamp-2">{video.summary || "No summary available"}</CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            <strong>Course:</strong> {video.module?.course?.title}
          </div>
          <div className="text-sm text-gray-600">
            <strong>Module:</strong> {video.module?.title}
          </div>
          {video.ai_detection_result?.reasoning && (
            <div className="text-sm text-gray-600">
              <strong>AI Reasoning:</strong> {video.ai_detection_result.reasoning}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={() => onDetect(video.id)} className="flex items-center gap-2">
          <Brain className="w-4 h-4" />
          Re-detect
        </Button>
        <Link href={`/learn?videoId=${video.id}`}>
          <Button size="sm" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            View Content
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
