"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  BookOpen,
  GraduationCap,
  Play,
  ExternalLink,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface Course {
  id: string
  title: string
  description: string | null
  modules: Module[]
  created_at: string
}

interface Module {
  id: string
  title: string
  description: string | null
  order_index: number
  videos: Video[]
}

interface Video {
  id: string
  title: string
  topic: string
  video_url: string
  summary: string | null
  order_index: number
}

export default function AdminPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "connected" | "error">("checking")

  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
  })

  const [moduleForm, setModuleForm] = useState({
    course_id: "",
    title: "",
    description: "",
  })

  const [videoForm, setVideoForm] = useState({
    module_id: "",
    title: "",
    topic: "",
    video_url: "",
  })

  const { toast } = useToast()

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      const response = await fetch("/api/courses")
      if (response.ok) {
        const data = await response.json()
        console.log("Fetched courses data:", data)
        // Ensure data is an array and has proper structure
        const coursesData = Array.isArray(data) ? data : []
        const coursesWithModules = coursesData.map((course) => ({
          ...course,
          modules: Array.isArray(course.modules)
            ? course.modules.map((module) => ({
                ...module,
                videos: Array.isArray(module.videos) ? module.videos : [],
              }))
            : [],
        }))
        setCourses(coursesWithModules)
        setConnectionStatus("connected")
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error("Connection error:", error)
      setConnectionStatus("error")
      setCourses([]) // Ensure courses is always an array
      toast({
        title: "Database Connection Error",
        description: "Please ensure Supabase is configured and tables are created.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const validateVideoUrl = (url: string) => {
    const supportedPlatforms = [
      /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
      /^https?:\/\/(www\.)?vimeo\.com\/\d+/,
      /^https?:\/\/(www\.)?loom\.com\/share\/[a-zA-Z0-9]+/,
      /^https?:\/\/.*\.wistia\.com\/medias\/[a-zA-Z0-9]+/,
      /^https?:\/\/.*\.cloudinary\.com\/.*\.(mp4|webm|mov)/,
      /^https?:\/\/(www\.)?streamable\.com\/[a-zA-Z0-9]+/,
      /^https?:\/\/.*\.(mp4|webm|ogg|mov)(\?.*)?$/i,
    ]

    return supportedPlatforms.some((pattern) => pattern.test(url))
  }

  const detectPlatform = (url: string) => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "YouTube"
    if (url.includes("vimeo.com")) return "Vimeo"
    if (url.includes("loom.com")) return "Loom"
    if (url.includes("wistia.com")) return "Wistia"
    if (url.includes("cloudinary.com")) return "Cloudinary"
    if (url.includes("streamable.com")) return "Streamable"
    if (url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)) return "Direct Video"
    return "Unknown"
  }

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courseForm),
      })

      if (!response.ok) throw new Error("Failed to create course")

      const newCourse = await response.json()
      setCourses([{ ...newCourse, modules: [] }, ...courses])
      setCourseForm({ title: "", description: "" })

      toast({
        title: "Success! 🎉",
        description: "Course created successfully!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create course. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const course = courses.find((c) => c.id === moduleForm.course_id)
      const order_index = course && Array.isArray(course.modules) ? course.modules.length + 1 : 1

      const response = await fetch("/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...moduleForm, order_index }),
      })

      if (!response.ok) throw new Error("Failed to create module")

      const newModule = await response.json()

      // Update courses state
      setCourses(
        courses.map((course) =>
          course.id === moduleForm.course_id
            ? { ...course, modules: [...(course.modules || []), { ...newModule, videos: [] }] }
            : course,
        ),
      )

      setModuleForm({ course_id: "", title: "", description: "" })

      toast({
        title: "Success! 🎉",
        description: "Module created successfully!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create module. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate video URL
    if (!validateVideoUrl(videoForm.video_url)) {
      const platform = detectPlatform(videoForm.video_url)
      toast({
        title: "Invalid Video URL",
        description: `Please enter a valid video URL. Detected: ${platform}. Check our hosting guide for supported platforms.`,
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      const course = courses.find(
        (c) => Array.isArray(c.modules) && c.modules.some((m) => m.id === videoForm.module_id),
      )
      const module = course?.modules?.find((m) => m.id === videoForm.module_id)
      const order_index = module && Array.isArray(module.videos) ? module.videos.length + 1 : 1

      const response = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...videoForm, order_index }),
      })

      if (!response.ok) throw new Error("Failed to create video")

      const newVideo = await response.json()

      // Update courses state
      setCourses(
        courses.map((course) => ({
          ...course,
          modules: (course.modules || []).map((module) =>
            module.id === videoForm.module_id ? { ...module, videos: [...(module.videos || []), newVideo] } : module,
          ),
        })),
      )

      setVideoForm({ module_id: "", title: "", topic: "", video_url: "" })

      const platform = detectPlatform(newVideo.video_url)
      toast({
        title: "Success! 🎉",
        description: `${platform} video added successfully with AI-generated summary!`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add video. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Play className="w-8 h-8 text-purple-600" />
            EduBuzzX Admin Panel
          </h1>
          <p className="text-gray-600">
            Manage courses, modules, and videos from multiple platforms with AI-powered content generation
          </p>
        </div>

        {/* Connection Status */}
        <Alert
          className={`mb-6 ${connectionStatus === "connected" ? "border-green-200 bg-green-50" : connectionStatus === "error" ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50"}`}
        >
          <div className="flex items-center gap-2">
            {connectionStatus === "checking" && <Loader2 className="w-4 h-4 animate-spin" />}
            {connectionStatus === "connected" && <CheckCircle className="w-4 h-4 text-green-600" />}
            {connectionStatus === "error" && <AlertCircle className="w-4 h-4 text-red-600" />}
            <AlertDescription>
              {connectionStatus === "checking" && "Checking database connection..."}
              {connectionStatus === "connected" && "✅ Database connected! Ready to manage multi-platform content."}
              {connectionStatus === "error" && "❌ Database connection failed. Please run the setup script."}
            </AlertDescription>
          </div>
        </Alert>

        {/* Video Hosting Guide Alert */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Play className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Need video hosting?</strong> Having trouble with YouTube embedding? Check out our{" "}
            <Link href="/video-hosting-guide" className="underline font-medium">
              Video Hosting Guide
            </Link>{" "}
            for the best alternatives like Vimeo, Loom, and more!
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          {/* Courses Tab */}
          <TabsContent value="courses">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Create New Course
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCourse} className="space-y-4">
                  <div>
                    <Label htmlFor="course-title">Course Title *</Label>
                    <Input
                      id="course-title"
                      value={courseForm.title}
                      onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                      placeholder="e.g., Python Programming Masterclass"
                      required
                      disabled={connectionStatus !== "connected"}
                    />
                  </div>
                  <div>
                    <Label htmlFor="course-description">Course Description</Label>
                    <Textarea
                      id="course-description"
                      value={courseForm.description}
                      onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                      placeholder="Brief description of what students will learn..."
                      disabled={connectionStatus !== "connected"}
                    />
                  </div>
                  <Button type="submit" disabled={submitting || connectionStatus !== "connected"}>
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Course
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Modules Tab */}
          <TabsContent value="modules">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Create New Module
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateModule} className="space-y-4">
                  <div>
                    <Label htmlFor="module-course">Select Course *</Label>
                    <select
                      id="module-course"
                      value={moduleForm.course_id}
                      onChange={(e) => setModuleForm({ ...moduleForm, course_id: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                      disabled={connectionStatus !== "connected"}
                    >
                      <option value="">Choose a course...</option>
                      {Array.isArray(courses) &&
                        courses.map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.title}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="module-title">Module Title *</Label>
                    <Input
                      id="module-title"
                      value={moduleForm.title}
                      onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                      placeholder="e.g., Python Basics"
                      required
                      disabled={connectionStatus !== "connected"}
                    />
                  </div>
                  <div>
                    <Label htmlFor="module-description">Module Description</Label>
                    <Textarea
                      id="module-description"
                      value={moduleForm.description}
                      onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                      placeholder="What will students learn in this module?"
                      disabled={connectionStatus !== "connected"}
                    />
                  </div>
                  <Button type="submit" disabled={submitting || connectionStatus !== "connected"}>
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Module
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-purple-600" />
                  Add New Video
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4 border-purple-200 bg-purple-50">
                  <Play className="w-4 h-4 text-purple-600" />
                  <AlertDescription className="text-purple-800">
                    <strong>Multi-Platform Support:</strong> Now supports YouTube, Vimeo, Loom, Wistia, Cloudinary,
                    Streamable, and direct video files!{" "}
                    <Link href="/video-hosting-guide" className="underline font-medium">
                      View hosting guide →
                    </Link>
                  </AlertDescription>
                </Alert>

                <form onSubmit={handleCreateVideo} className="space-y-4">
                  <div>
                    <Label htmlFor="video-module">Select Module *</Label>
                    <select
                      id="video-module"
                      value={videoForm.module_id}
                      onChange={(e) => setVideoForm({ ...videoForm, module_id: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                      disabled={connectionStatus !== "connected"}
                    >
                      <option value="">Choose a module...</option>
                      {Array.isArray(courses) &&
                        courses.map(
                          (course) =>
                            Array.isArray(course.modules) &&
                            course.modules.map((module) => (
                              <option key={module.id} value={module.id}>
                                {course.title} → {module.title}
                              </option>
                            )),
                        )}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="video-title">Video Title *</Label>
                      <Input
                        id="video-title"
                        value={videoForm.title}
                        onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                        placeholder="e.g., Variables and Data Types"
                        required
                        disabled={connectionStatus !== "connected"}
                      />
                    </div>
                    <div>
                      <Label htmlFor="video-topic">Topic *</Label>
                      <Input
                        id="video-topic"
                        value={videoForm.topic}
                        onChange={(e) => setVideoForm({ ...videoForm, topic: e.target.value })}
                        placeholder="e.g., Python Fundamentals"
                        required
                        disabled={connectionStatus !== "connected"}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="video-url">Video URL *</Label>
                    <Input
                      id="video-url"
                      value={videoForm.video_url}
                      onChange={(e) => setVideoForm({ ...videoForm, video_url: e.target.value })}
                      placeholder="https://vimeo.com/123456789 or https://loom.com/share/abc123"
                      required
                      disabled={connectionStatus !== "connected"}
                    />
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-500">
                        ✅ Supported: YouTube, Vimeo, Loom, Wistia, Cloudinary, Streamable, Direct MP4/WebM
                      </p>
                      <p className="text-xs text-gray-500">
                        🎥 Make sure the video is public/unlisted with embedding enabled
                      </p>
                      {videoForm.video_url && (
                        <p className="text-xs text-blue-600">
                          Detected platform: <strong>{detectPlatform(videoForm.video_url)}</strong>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={submitting || connectionStatus !== "connected"} className="flex-1">
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adding Video & Generating AI Summary...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Add Video
                        </>
                      )}
                    </Button>
                    <Button type="button" variant="outline" asChild>
                      <Link href="/video-hosting-guide">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Hosting Guide
                      </Link>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="space-y-6">
              {Array.isArray(courses) &&
                courses.map((course) => (
                  <Card key={course.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-5 h-5 text-purple-600" />
                          {course.title}
                        </div>
                        <span className="text-sm text-gray-500">
                          {Array.isArray(course.modules) ? course.modules.length : 0} modules
                        </span>
                      </CardTitle>
                      {course.description && <p className="text-gray-600">{course.description}</p>}
                    </CardHeader>
                    <CardContent>
                      {!Array.isArray(course.modules) || course.modules.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No modules yet. Create your first module!</p>
                      ) : (
                        <div className="space-y-4">
                          {course.modules.map((module) => (
                            <div key={module.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                  <BookOpen className="w-4 h-4 text-blue-600" />
                                  {module.title}
                                </h4>
                                <span className="text-sm text-gray-500">
                                  {Array.isArray(module.videos) ? module.videos.length : 0} videos
                                </span>
                              </div>
                              {module.description && <p className="text-sm text-gray-600 mb-3">{module.description}</p>}

                              {Array.isArray(module.videos) && module.videos.length > 0 && (
                                <div className="space-y-2">
                                  <h5 className="text-sm font-medium text-gray-700">Videos:</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {module.videos.map((video) => (
                                      <div key={video.id} className="bg-gray-50 rounded p-3">
                                        <p className="font-medium text-sm">{video.title}</p>
                                        <p className="text-xs text-gray-600">{video.topic}</p>
                                        <p className="text-xs text-purple-600 font-medium">
                                          {detectPlatform(video.video_url)}
                                        </p>
                                        <div className="flex gap-2 mt-2">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                              window.open(`/learn?moduleId=${module.id}&videoId=${video.id}`, "_blank")
                                            }
                                          >
                                            <Sparkles className="w-3 h-3 mr-1" />
                                            Learn
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => window.open(video.video_url, "_blank")}
                                          >
                                            <ExternalLink className="w-3 h-3 mr-1" />
                                            Video
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

              {!Array.isArray(courses) || courses.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Play className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No Courses Yet</h3>
                    <p className="text-gray-600 mb-4">Create your first course and add videos from any platform!</p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={() => document.querySelector('[value="courses"]')?.click()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Course
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href="/video-hosting-guide">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Hosting Guide
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
