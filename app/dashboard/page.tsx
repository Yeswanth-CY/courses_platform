"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Play, ArrowRight, Layers, Sparkles } from "lucide-react"
import Link from "next/link"

interface Course {
  id: string
  title: string
  description: string
  primary_language: string
  course_type: string
  thumbnail_url: string
  modules_count: number
}

interface Module {
  id: string
  title: string
  description: string
  order_index: number
  videos_count: number
  course: {
    title: string
    primary_language: string
  }
}

interface Video {
  id: string
  title: string
  topic: string
  summary: string
  programming_language: string
  content_type: string
  module: {
    title: string
    course: {
      title: string
      primary_language: string
    }
  }
}

export default function Dashboard() {
  const [courses, setCourses] = useState<Course[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("courses")

  useEffect(() => {
    async function fetchData() {
      setLoading(true)

      // Fetch courses with module count
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select(`
          id, 
          title, 
          description, 
          primary_language, 
          course_type, 
          thumbnail_url,
          modules:modules(count)
        `)
        .order("title")

      if (coursesData) {
        setCourses(
          coursesData.map((course) => ({
            ...course,
            modules_count: course.modules?.[0]?.count || 0,
          })),
        )
      }

      // Fetch modules with course info and video count
      const { data: modulesData, error: modulesError } = await supabase
        .from("modules")
        .select(`
          id, 
          title, 
          description, 
          order_index,
          videos:videos(count),
          course:courses(title, primary_language)
        `)
        .order("order_index")
        .limit(10)

      if (modulesData) {
        setModules(
          modulesData.map((module) => ({
            ...module,
            videos_count: module.videos?.[0]?.count || 0,
          })),
        )
      }

      // Fetch videos with module and course info
      const { data: videosData, error: videosError } = await supabase
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
        .limit(10)

      if (videosData) {
        setVideos(videosData)
      }

      setLoading(false)
    }

    fetchData()
  }, [])

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
          <p className="text-gray-600">Loading courses and content...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">EduBuzzX Dashboard</h1>
        <p className="text-gray-600">Explore courses, modules, and videos with intelligent language detection</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span>Courses ({courses.length})</span>
          </TabsTrigger>
          <TabsTrigger value="modules" className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <span>Modules ({modules.length})</span>
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            <span>Videos ({videos.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{course.title}</CardTitle>
                    {course.primary_language && (
                      <Badge className={getLanguageBadgeColor(course.primary_language)}>
                        {course.primary_language}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Layers className="w-4 h-4" />
                    <span>{course.modules_count} modules</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    View Course
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="modules" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules.map((module) => (
              <Card key={module.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle>{module.title}</CardTitle>
                    {module.course?.primary_language && (
                      <Badge className={getLanguageBadgeColor(module.course.primary_language)}>
                        {module.course.primary_language}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">{module.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Play className="w-4 h-4" />
                      <span>{module.videos_count} videos</span>
                    </div>
                    <div className="text-sm text-gray-600">From: {module.course?.title}</div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    View Module
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="videos" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {videos.map((video) => {
              const confidence = getLanguageConfidence(video)
              const detectedLanguage = getDetectedLanguage(video)

              return (
                <Card key={video.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{video.title}</CardTitle>
                      <div className="flex gap-2">
                        {detectedLanguage && (
                          <Badge className={getLanguageBadgeColor(detectedLanguage)}>{detectedLanguage}</Badge>
                        )}
                        {confidence.level !== "unknown" && (
                          <Badge
                            variant="outline"
                            className={
                              confidence.level === "high"
                                ? "bg-green-50 text-green-700"
                                : confidence.level === "medium"
                                  ? "bg-yellow-50 text-yellow-700"
                                  : "bg-orange-50 text-orange-700"
                            }
                          >
                            {confidence.level} confidence
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription className="line-clamp-2">{video.summary}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Layers className="w-4 h-4" />
                        <span>Module: {video.module?.title}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <BookOpen className="w-4 h-4" />
                        <span>Course: {video.module?.course?.title}</span>
                      </div>
                      {confidence.source !== "none" && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Sparkles className="w-4 h-4" />
                          <span>Language detected from: {confidence.source}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline">Watch Video</Button>
                    <Link href={`/learn?videoId=${video.id}`}>
                      <Button className="flex items-center gap-2">
                        <span>Generate Learning Content</span>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
