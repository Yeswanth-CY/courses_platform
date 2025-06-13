"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Code2, BookOpen, Sparkles, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"

interface Video {
  id: string
  title: string
  topic: string
  summary: string
  programming_language: string | null
  content_type: string | null
  module: {
    title: string
    course: {
      title: string
      primary_language: string | null
    }
  }
}

export default function LanguageDetectionPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    async function fetchVideos() {
      setLoading(true)

      const { data, error } = await supabase
        .from("videos")
        .select(`
          id, 
          title, 
          topic, 
          summary,
          programming_language,
          content_type,
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
      }

      setLoading(false)
    }

    fetchVideos()
  }, [])

  // Filter videos based on active tab
  const filteredVideos = videos.filter((video) => {
    if (activeTab === "all") return true
    if (activeTab === "explicit" && video.programming_language) return true
    if (activeTab === "course" && !video.programming_language && video.module?.course?.primary_language) return true
    if (activeTab === "title") {
      const hasExplicit = !!video.programming_language
      const hasCourse = !!video.module?.course?.primary_language
      if (hasExplicit || hasCourse) return false

      return !!video.title.match(/(Python|JavaScript|Java|TypeScript)/i)
    }
    if (activeTab === "summary") {
      const hasExplicit = !!video.programming_language
      const hasCourse = !!video.module?.course?.primary_language
      const hasTitle = !!video.title.match(/(Python|JavaScript|Java|TypeScript)/i)
      if (hasExplicit || hasCourse || hasTitle) return false

      return !!(video.summary && video.summary.match(/(Python|JavaScript|Java|TypeScript)/i))
    }
    if (activeTab === "unknown") {
      const hasExplicit = !!video.programming_language
      const hasCourse = !!video.module?.course?.primary_language
      const hasTitle = !!video.title.match(/(Python|JavaScript|Java|TypeScript)/i)
      const hasSummary = !!(video.summary && video.summary.match(/(Python|JavaScript|Java|TypeScript)/i))

      return !(hasExplicit || hasCourse || hasTitle || hasSummary)
    }

    return false
  })

  // Helper function to determine language badge color
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

  // Helper function to determine language confidence
  const getLanguageConfidence = (video: Video): { level: string; source: string } => {
    // Direct language assignment has highest confidence
    if (video.programming_language) {
      return { level: "high", source: "video" }
    }

    // Course primary language has medium confidence
    if (video.module?.course?.primary_language) {
      return { level: "medium", source: "course" }
    }

    // Check title for language keywords
    const titleMatch = video.title.match(/(Python|JavaScript|Java|TypeScript)/i)
    if (titleMatch) {
      return { level: "medium", source: "title" }
    }

    // Check summary for language keywords
    if (video.summary) {
      const summaryMatch = video.summary.match(/(Python|JavaScript|Java|TypeScript)/i)
      if (summaryMatch) {
        return { level: "low", source: "summary" }
      }
    }

    return { level: "unknown", source: "none" }
  }

  // Helper function to get detected language
  const getDetectedLanguage = (video: Video): string | null => {
    if (video.programming_language) {
      return video.programming_language
    }

    if (video.module?.course?.primary_language) {
      return video.module.course.primary_language
    }

    const titleMatch = video.title.match(/(Python|JavaScript|Java|TypeScript)/i)
    if (titleMatch) {
      return titleMatch[1]
    }

    if (video.summary) {
      const summaryMatch = video.summary.match(/(Python|JavaScript|Java|TypeScript)/i)
      if (summaryMatch) {
        return summaryMatch[1]
      }
    }

    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
          <p className="text-gray-600">Loading videos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Language Detection System</h1>
        <p className="text-gray-600">
          See how the multi-source context detection system identifies programming languages
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-blue-800 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Multi-Source Context Detection
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="font-medium text-blue-700">Detection Sources (Priority Order)</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800">High Confidence</Badge>
                <span>Video's explicit programming_language field</span>
              </li>
              <li className="flex items-center gap-2">
                <Badge className="bg-yellow-100 text-yellow-800">Medium Confidence</Badge>
                <span>Course's primary_language field</span>
              </li>
              <li className="flex items-center gap-2">
                <Badge className="bg-yellow-100 text-yellow-800">Medium Confidence</Badge>
                <span>Language name in video title</span>
              </li>
              <li className="flex items-center gap-2">
                <Badge className="bg-orange-100 text-orange-800">Low Confidence</Badge>
                <span>Language name in video summary</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium text-blue-700">Detection Statistics</h3>
            <ul className="space-y-2">
              <li className="flex items-center justify-between">
                <span>Videos with explicit language:</span>
                <Badge variant="outline" className="bg-green-50">
                  {videos.filter((v) => !!v.programming_language).length} / {videos.length}
                </Badge>
              </li>
              <li className="flex items-center justify-between">
                <span>Videos using course language:</span>
                <Badge variant="outline" className="bg-yellow-50">
                  {videos.filter((v) => !v.programming_language && !!v.module?.course?.primary_language).length} /{" "}
                  {videos.length}
                </Badge>
              </li>
              <li className="flex items-center justify-between">
                <span>Videos with unknown language:</span>
                <Badge variant="outline" className="bg-red-50">
                  {
                    videos.filter((v) => {
                      const hasExplicit = !!v.programming_language
                      const hasCourse = !!v.module?.course?.primary_language
                      const hasTitle = !!v.title.match(/(Python|JavaScript|Java|TypeScript)/i)
                      const hasSummary = !!(v.summary && v.summary.match(/(Python|JavaScript|Java|TypeScript)/i))
                      return !(hasExplicit || hasCourse || hasTitle || hasSummary)
                    }).length
                  }{" "}
                  / {videos.length}
                </Badge>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-8">
          <TabsTrigger value="all">All ({videos.length})</TabsTrigger>
          <TabsTrigger value="explicit">Explicit ({videos.filter((v) => !!v.programming_language).length})</TabsTrigger>
          <TabsTrigger value="course">
            From Course ({videos.filter((v) => !v.programming_language && !!v.module?.course?.primary_language).length})
          </TabsTrigger>
          <TabsTrigger value="title">From Title</TabsTrigger>
          <TabsTrigger value="summary">From Summary</TabsTrigger>
          <TabsTrigger value="unknown">Unknown</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredVideos.map((video) => {
              const confidence = getLanguageConfidence(video)
              const detectedLanguage = getDetectedLanguage(video)

              return (
                <Card
                  key={video.id}
                  className={
                    confidence.level === "unknown"
                      ? "border-red-200 bg-red-50"
                      : confidence.level === "high"
                        ? "border-green-200"
                        : ""
                  }
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{video.title}</CardTitle>
                      <div className="flex gap-2">
                        {detectedLanguage ? (
                          <Badge className={getLanguageBadgeColor(detectedLanguage)}>{detectedLanguage}</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700">
                            Unknown
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {video.summary || "No summary available"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <BookOpen className="w-4 h-4 text-gray-600" />
                        <span className="text-gray-600">
                          Course: {video.module?.course?.title || "Unknown"}
                          {video.module?.course?.primary_language && (
                            <span className="ml-2">
                              (Language: <span className="font-medium">{video.module.course.primary_language}</span>)
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {confidence.level === "unknown" ? (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <CheckCircle
                            className={
                              confidence.level === "high"
                                ? "w-4 h-4 text-green-500"
                                : confidence.level === "medium"
                                  ? "w-4 h-4 text-yellow-500"
                                  : "w-4 h-4 text-orange-500"
                            }
                          />
                        )}
                        <span
                          className={
                            confidence.level === "unknown"
                              ? "text-red-700"
                              : confidence.level === "high"
                                ? "text-green-700"
                                : confidence.level === "medium"
                                  ? "text-yellow-700"
                                  : "text-orange-700"
                          }
                        >
                          {confidence.level === "unknown"
                            ? "No language detected"
                            : `${confidence.level} confidence (detected from ${confidence.source})`}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link href={`/learn?videoId=${video.id}`} className="w-full">
                      <Button className="w-full flex items-center justify-center gap-2">
                        <Code2 className="w-4 h-4" />
                        <span>Generate Learning Content</span>
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              )
            })}
          </div>

          {filteredVideos.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No videos found for this filter</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
