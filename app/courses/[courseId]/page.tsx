"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BookOpen, CheckCircle, Circle, ArrowLeft, Star, Loader2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/user-context"

interface CourseStats {
  totalModules: number
  totalVideos: number
  completedVideos: number
  completedModules: number
  progressPercentage: number
  averageRating: number
  totalRatings: number
}

interface Course {
  id: string
  title: string
  description: string
  primary_language: string
  course_type: string
  modules: Array<{
    id: string
    title: string
    description: string
    order_index: number
    videos: Array<{
      id: string
      title: string
      topic: string
      order_index: number
    }>
  }>
}

export default function CoursePage({ params }: { params: { courseId: string } }) {
  const [course, setCourse] = useState<Course | null>(null)
  const [stats, setStats] = useState<CourseStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useUser()
  const { toast } = useToast()

  useEffect(() => {
    if (user?.id) {
      fetchCourseData()
    } else {
      setLoading(false)
    }
  }, [params.courseId, user?.id])

  const fetchCourseData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/courses/${params.courseId}/stats?userId=${user?.id || ""}`)

      if (!response.ok) {
        throw new Error("Failed to fetch course data")
      }

      const data = await response.json()
      setCourse(data.course)
      setStats(data.stats)
    } catch (error) {
      console.error("Error fetching course:", error)
      toast({
        title: "Error",
        description: "Failed to load course data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <CourseLoading />
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl max-w-md mx-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Please Log In</h3>
          <p className="text-gray-600 mb-6">You need to be logged in to track your course progress.</p>
          <Link href="/login">
            <Button className="bg-purple-600 hover:bg-purple-700">Go to Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!course || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Course Not Found</h3>
          <p className="text-gray-500 mb-6">The course you're looking for doesn't exist.</p>
          <Link href="/courses">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Courses
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link href="/courses" className="text-white/80 hover:text-white flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Courses
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="secondary" className="bg-white/20 text-white border-none">
                  {course.primary_language}
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-none">
                  {course.course_type}
                </Badge>
              </div>

              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-xl opacity-90 mb-6">{course.description}</p>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.totalModules}</div>
                  <div className="text-sm opacity-80">Modules</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.totalVideos}</div>
                  <div className="text-sm opacity-80">Videos</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-5 h-5 fill-current text-yellow-300" />
                    <div className="text-2xl font-bold">{stats.averageRating || "N/A"}</div>
                  </div>
                  <div className="text-sm opacity-80">
                    {stats.totalRatings > 0 ? `${stats.totalRatings} ratings` : "No ratings"}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">Course Progress</h3>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Completed</span>
                  <span>{stats.progressPercentage}%</span>
                </div>
                <Progress value={stats.progressPercentage} className="h-3 bg-white/20" />
              </div>
              <div className="text-sm opacity-90">
                {stats.completedVideos} of {stats.totalVideos} videos completed
              </div>
              <div className="text-sm opacity-90 mt-1">
                {stats.completedModules} of {stats.totalModules} modules completed
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modules Section */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Course Modules</h2>

        {course.modules && course.modules.length > 0 ? (
          <div className="space-y-6">
            {course.modules
              .sort((a, b) => a.order_index - b.order_index)
              .map((module, index) => (
                <ModuleCard key={module.id} module={module} courseId={course.id} index={index} userId={user.id} />
              ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Modules Available</h3>
            <p className="text-gray-500">This course is still being developed.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ModuleCard({
  module,
  courseId,
  index,
  userId,
}: {
  module: any
  courseId: string
  index: number
  userId: string
}) {
  const [moduleStats, setModuleStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchModuleStats()
  }, [module.id, userId])

  const fetchModuleStats = async () => {
    try {
      const response = await fetch(`/api/modules/stats?id=${module.id}&userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setModuleStats(data.stats)
      }
    } catch (error) {
      console.error("Error fetching module stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const videoCount = module.videos?.length || 0
  const completedVideos = moduleStats?.completedVideos || 0
  const progressPercentage = moduleStats?.progressPercentage || 0

  return (
    <Card className="hover:shadow-xl transition-all duration-300 bg-white border-0 shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 text-white">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="bg-white/20 text-white border-none">
                Module {module.order_index}
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-none">
                {videoCount} Videos
              </Badge>
              {progressPercentage === 100 && (
                <Badge variant="secondary" className="bg-green-500 text-white border-none">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Complete
                </Badge>
              )}
            </div>
            <h3 className="text-xl font-bold mb-2">{module.title}</h3>
            <p className="opacity-90">{module.description}</p>
          </div>
        </div>
      </div>

      <CardContent className="p-6">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{progressPercentage}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          {!loading && (
            <div className="text-xs text-gray-500 mt-1">
              {completedVideos} of {videoCount} videos completed
            </div>
          )}
        </div>

        {/* Videos Preview */}
        <div className="space-y-3 mb-6">
          <h4 className="font-semibold text-gray-900">Videos in this module:</h4>
          {videoCount > 0 ? (
            <>
              {module.videos.slice(0, 3).map((video: any, videoIndex: number) => (
                <div key={video.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <Circle className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{video.title}</h5>
                    <p className="text-sm text-gray-600">{video.topic}</p>
                  </div>
                </div>
              ))}

              {videoCount > 3 && (
                <div className="text-sm text-gray-500 text-center py-2">+{videoCount - 3} more videos</div>
              )}
            </>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <Circle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No videos available in this module</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Link href={`/courses/${courseId}/modules/${module.id}`} className="flex-1">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <BookOpen className="w-4 h-4 mr-2" />
              View Module
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function CourseLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 py-8 animate-pulse">
          <div className="h-6 bg-white/20 rounded mb-6 w-32"></div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="h-8 bg-white/20 rounded mb-4 w-64"></div>
              <div className="h-12 bg-white/20 rounded mb-4"></div>
              <div className="h-6 bg-white/20 rounded mb-6 w-96"></div>
              <div className="grid grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="text-center">
                    <div className="h-8 bg-white/20 rounded mb-1"></div>
                    <div className="h-4 bg-white/20 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
              <div className="h-6 bg-white/20 rounded mb-4"></div>
              <div className="h-3 bg-white/20 rounded mb-2"></div>
              <div className="h-4 bg-white/20 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="h-8 bg-gray-200 rounded mb-8 w-64 animate-pulse"></div>
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="bg-gray-200 h-24"></div>
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
