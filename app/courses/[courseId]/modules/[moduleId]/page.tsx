"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, ArrowLeft, BookOpen, AlertCircle, Play, CheckCircle, Loader2, Sparkles } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { VideoPlayer } from "@/components/video-player"
import { NotesSlides } from "@/components/notes-slides"
import { SimpleExplanation } from "@/components/simple-explanation"
import { CodeExamples } from "@/components/code-examples"
import { PracticalExamples } from "@/components/practical-examples"
import { QuizFlash } from "@/components/quiz-flash"
import { FlashcardSet } from "@/components/flashcard-set"
import { Glossary } from "@/components/glossary"
import { ChallengeInput } from "@/components/challenge-input"
import { useUser } from "@/contexts/user-context"

interface ModuleStats {
  totalVideos: number
  completedVideos: number
  progressPercentage: number
  estimatedTime: number
}

interface UserProgress {
  video_id: string
  completed: boolean
  progress_percentage: number
  time_spent: number
  last_watched_at: string
}

interface LearningContent {
  notes: Array<{
    id: number
    title: string
    content: string
    illustration: string
  }>
  simpleExplanation: {
    title: string
    explanation: string
    keyPoints: string[]
  }
  codeExamples?: Array<{
    id: number
    title: string
    description: string
    code: string
    output?: string
    explanation: string
    language?: string
  }>
  practicalExamples?: Array<{
    id: number
    scenario: string
    problem: string
    solution: string
    outcome: string
  }>
  questions: Array<{
    id: number
    question: string
    options: string[]
    correctAnswer: number
    explanation: string
  }>
  flashcards: Array<{
    id: number
    term: string
    definition: string
  }>
  glossary: Array<{
    term: string
    definition: string
  }>
  analogy: string
  challengePrompt: string
  detectedLanguage?: string
  contentType?: "programming" | "general"
}

export default function ModulePage({ params }: { params: { courseId: string; moduleId: string } }) {
  const [module, setModule] = useState<any>(null)
  const [stats, setStats] = useState<ModuleStats | null>(null)
  const [userProgress, setUserProgress] = useState<UserProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null)
  const [learningContent, setLearningContent] = useState<LearningContent | null>(null)
  const [loadingContent, setLoadingContent] = useState(false)
  const [updatingProgress, setUpdatingProgress] = useState(false)
  const { user } = useUser()
  const { toast } = useToast()

  useEffect(() => {
    if (user?.id) {
      fetchModuleData()
    }
  }, [params.moduleId, user?.id])

  useEffect(() => {
    if (module?.videos?.length > 0 && !activeVideoId) {
      setActiveVideoId(module.videos[0].id)
    }
  }, [module])

  useEffect(() => {
    if (activeVideoId) {
      fetchLearningContent(activeVideoId)
    }
  }, [activeVideoId])

  const fetchModuleData = async () => {
    if (!user?.id) {
      setError("Please log in to view this module")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Use the new stats API endpoint
      const response = await fetch(`/api/modules/${params.moduleId}/stats?userId=${user.id}`)

      if (!response.ok) {
        if (response.status === 404) {
          setError("Module not found")
          return
        }
        throw new Error(`Failed to fetch module: ${response.status}`)
      }

      const data = await response.json()

      if (!data || !data.module) {
        throw new Error("Invalid module data received")
      }

      setModule(data.module)
      setStats(data.stats)
      setUserProgress(data.userProgress || [])
    } catch (error) {
      console.error("Error fetching module:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to load module"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchLearningContent = async (videoId: string) => {
    try {
      setLoadingContent(true)
      setLearningContent(null) // Clear previous content

      // First try to get video-specific AI-generated content
      const response = await fetch(`/api/learning-content/${videoId}`)

      if (response.ok) {
        const data = await response.json()
        setLearningContent(data)
        return
      }

      // If video content doesn't exist, try module-level content
      const moduleResponse = await fetch(`/api/learning-content/module/${params.moduleId}`)

      if (moduleResponse.ok) {
        const moduleData = await moduleResponse.json()
        setLearningContent(moduleData)
        return
      }

      // If no content exists, this will trigger AI generation
      throw new Error("No learning content available - will generate new content")
    } catch (error) {
      console.error("Error fetching learning content:", error)

      // Show error message but don't set fallback content
      toast({
        title: "Generating Content",
        description: "AI is creating learning materials for this video. This may take a moment...",
        variant: "default",
      })

      // Don't set any fallback content - let the UI show the generation state
      setLearningContent(null)
    } finally {
      setLoadingContent(false)
    }
  }

  const generateLearningContent = async () => {
    if (!activeVideoId) return

    try {
      setLoadingContent(true)
      toast({
        title: "Generating AI Content",
        description: "Creating personalized learning materials...",
      })

      // Force generation of new content
      const response = await fetch(`/api/learning-content/${activeVideoId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceRegenerate: true }),
      })

      if (response.ok) {
        const data = await response.json()
        setLearningContent(data)
        toast({
          title: "Content Generated!",
          description: "AI has created your personalized learning materials.",
        })
      } else {
        throw new Error("Failed to generate content")
      }
    } catch (error) {
      console.error("Error generating content:", error)
      toast({
        title: "Generation Failed",
        description: "Could not generate learning content. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingContent(false)
    }
  }

  const updateVideoProgress = async (videoId: string, completed: boolean) => {
    if (!user?.id) {
      toast({
        title: "Login Required",
        description: "Please log in to track your progress",
        variant: "destructive",
      })
      return
    }

    try {
      setUpdatingProgress(true)

      const response = await fetch("/api/progress/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          videoId,
          moduleId: params.moduleId,
          courseId: params.courseId,
          completed,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update progress")
      }

      const result = await response.json()

      // Update local state with the new progress data
      setUserProgress((prev) => {
        const existingIndex = prev.findIndex((p) => p.video_id === videoId)
        if (existingIndex >= 0) {
          const updated = [...prev]
          updated[existingIndex] = {
            ...updated[existingIndex],
            completed,
            progress_percentage: completed ? 100 : 0,
          }
          return updated
        } else {
          return [
            ...prev,
            {
              video_id: videoId,
              completed,
              progress_percentage: completed ? 100 : 0,
              time_spent: 0,
              last_watched_at: new Date().toISOString(),
            },
          ]
        }
      })

      // Update module stats
      if (stats) {
        setStats({
          ...stats,
          completedVideos: result.moduleProgress.completedVideos,
          progressPercentage: result.moduleProgress.progressPercentage,
        })
      }

      toast({
        title: completed ? "Video Completed!" : "Progress Updated",
        description: completed ? "Great job! Keep learning." : "Your progress has been saved.",
      })
    } catch (error) {
      console.error("Error updating progress:", error)
      toast({
        title: "Error",
        description: "Failed to save progress. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdatingProgress(false)
    }
  }

  const isVideoCompleted = (videoId: string) => {
    return userProgress.some((p) => p.video_id === videoId && p.completed)
  }

  const getVideoProgress = (videoId: string) => {
    const progress = userProgress.find((p) => p.video_id === videoId)
    return progress?.progress_percentage || 0
  }

  if (loading) {
    return <ModuleLoading />
  }

  if (error || !module) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl max-w-md mx-4">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {error === "Module not found" ? "Module Not Found" : "Error Loading Module"}
          </h3>
          <p className="text-gray-600 mb-6">
            {error === "Module not found"
              ? "The module you're looking for doesn't exist or has been removed."
              : error || "Something went wrong while loading the module. Please try again."}
          </p>
          <div className="flex gap-3 justify-center">
            <Link href={`/courses/${params.courseId}`}>
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Course
              </Button>
            </Link>
            <Button onClick={fetchModuleData}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  const activeVideo = module.videos?.find((v: any) => v.id === activeVideoId) || module.videos?.[0] || null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="mb-6 text-sm">
            <Link href="/courses" className="text-white/80 hover:text-white transition-colors">
              Courses
            </Link>
            <span className="mx-2">/</span>
            <Link href={`/courses/${params.courseId}`} className="text-white/80 hover:text-white transition-colors">
              {module.course?.title || "Course"}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white">{module.title}</span>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="secondary" className="bg-white/20 text-white border-none">
                  Module {module.order_index}
                </Badge>
                {module.course?.primary_language && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-none">
                    {module.course.primary_language}
                  </Badge>
                )}
                {stats?.progressPercentage === 100 && (
                  <Badge variant="secondary" className="bg-green-500 text-white border-none">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Complete
                  </Badge>
                )}
              </div>

              <h1 className="text-4xl font-bold mb-4">{module.title}</h1>
              <p className="text-xl opacity-90 mb-6">{module.description}</p>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats?.totalVideos || 0}</div>
                  <div className="text-sm opacity-80">Videos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats?.completedVideos || 0}</div>
                  <div className="text-sm opacity-80">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats?.estimatedTime || 0}</div>
                  <div className="text-sm opacity-80">Minutes</div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">Module Progress</h3>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Completed</span>
                  <span>{Math.round(stats?.progressPercentage || 0)}%</span>
                </div>
                <Progress value={stats?.progressPercentage || 0} className="h-3 bg-white/20" />
              </div>
              <div className="text-sm opacity-90">
                {stats?.completedVideos || 0} of {stats?.totalVideos || 0} videos completed
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-8">
        {stats?.totalVideos && stats.totalVideos > 0 ? (
          <div className="grid md:grid-cols-3 gap-8">
            {/* Video List Sidebar */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Play className="w-5 h-5 mr-2 text-purple-600" />
                  Module Videos
                </h2>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {module.videos
                    ?.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
                    .map((video: any, index: number) => {
                      const completed = isVideoCompleted(video.id)
                      const progress = getVideoProgress(video.id)

                      return (
                        <div
                          key={video.id || index}
                          className={`p-3 rounded-lg cursor-pointer transition-all ${
                            activeVideoId === video.id
                              ? "bg-purple-100 border-l-4 border-purple-600"
                              : "hover:bg-gray-100"
                          }`}
                          onClick={() => setActiveVideoId(video.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              {completed ? (
                                <CheckCircle className="w-6 h-6 text-green-500" />
                              ) : (
                                <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center">
                                  {video.order_index || index + 1}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{video.title}</h3>
                              <p className="text-sm text-gray-500 line-clamp-2">{video.topic || video.summary}</p>
                              {progress > 0 && progress < 100 && (
                                <div className="mt-2">
                                  <Progress value={progress} className="h-1" />
                                  <span className="text-xs text-gray-400">{progress}% watched</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="md:col-span-2">
              {activeVideo ? (
                <Tabs defaultValue="video" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="video" className="flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      Video
                    </TabsTrigger>
                    <TabsTrigger value="learning" className="flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      AI Learning
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="video" className="mt-0">
                    <Card className="border-0 shadow-lg overflow-hidden">
                      <CardContent className="p-0">
                        <div className="aspect-video bg-black">
                          <VideoPlayer
                            videoUrl={activeVideo.video_url}
                            title={activeVideo.title}
                            topic={activeVideo.topic}
                            summary={activeVideo.summary}
                            className="w-full h-full"
                          />
                        </div>
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h2 className="text-2xl font-bold mb-2">{activeVideo.title}</h2>
                              <p className="text-gray-600 mb-4">{activeVideo.summary || activeVideo.topic}</p>
                            </div>
                            <div className="flex gap-2">
                              {!isVideoCompleted(activeVideo.id) ? (
                                <Button
                                  onClick={() => updateVideoProgress(activeVideo.id, true)}
                                  className="bg-green-600 hover:bg-green-700"
                                  disabled={updatingProgress}
                                >
                                  {updatingProgress ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Updating...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Mark Complete
                                    </>
                                  )}
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => updateVideoProgress(activeVideo.id, false)}
                                  variant="outline"
                                  disabled={updatingProgress}
                                >
                                  {updatingProgress ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Updating...
                                    </>
                                  ) : (
                                    "Mark Incomplete"
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {activeVideo.programming_language && (
                              <Badge variant="outline">{activeVideo.programming_language}</Badge>
                            )}
                            <Badge variant="outline">{activeVideo.content_type || "General"}</Badge>
                            {isVideoCompleted(activeVideo.id) && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Completed
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="learning" className="mt-0">
                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-6">
                        {loadingContent ? (
                          <div className="text-center py-12">
                            <div className="relative">
                              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-600" />
                              <Sparkles className="w-6 h-6 absolute -top-1 -right-1 text-yellow-500 animate-pulse" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">Generating Learning Content</h2>
                            <p className="text-gray-600">
                              Creating AI-powered learning materials specifically for this content...
                            </p>
                          </div>
                        ) : learningContent ? (
                          <div className="space-y-8">
                            <NotesSlides notes={learningContent.notes} />

                            <SimpleExplanation
                              title={learningContent.simpleExplanation.title}
                              explanation={learningContent.simpleExplanation.explanation}
                              keyPoints={learningContent.simpleExplanation.keyPoints}
                            />

                            {learningContent.codeExamples && learningContent.codeExamples.length > 0 && (
                              <CodeExamples
                                examples={learningContent.codeExamples}
                                language={learningContent.detectedLanguage}
                              />
                            )}

                            {learningContent.practicalExamples && learningContent.practicalExamples.length > 0 && (
                              <PracticalExamples
                                examples={learningContent.practicalExamples}
                                topic={activeVideo.title}
                              />
                            )}

                            <div className="bg-gradient-to-br from-amber-100 to-yellow-100 rounded-xl p-6">
                              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                💡 Learning Analogy
                                <Sparkles className="w-4 h-4 text-yellow-600" />
                              </h3>
                              <p className="text-gray-700 leading-relaxed">{learningContent.analogy}</p>
                            </div>

                            <QuizFlash questions={learningContent.questions} onComplete={() => {}} />

                            <FlashcardSet flashcards={learningContent.flashcards} />

                            <Glossary terms={learningContent.glossary} />

                            <ChallengeInput topic={learningContent.challengePrompt} onSubmit={() => {}} />
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">No AI Content Available</h3>
                            <p className="text-gray-500 mb-6">
                              AI learning content for this video hasn't been generated yet.
                            </p>
                            <Button onClick={generateLearningContent} className="bg-purple-600 hover:bg-purple-700">
                              <Sparkles className="w-4 h-4 mr-2" />
                              Generate AI Content
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No Videos Available</h3>
                  <p className="text-gray-500 mb-6">This module is still being developed.</p>
                  <Link href={`/courses/${params.courseId}`}>
                    <Button variant="outline">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Course
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Videos Available</h3>
            <p className="text-gray-500 mb-6">This module is still being developed.</p>
            <Link href={`/courses/${params.courseId}`}>
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Course
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function ModuleLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 py-8 animate-pulse">
          <div className="h-6 bg-white/20 rounded mb-6 w-96"></div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="flex gap-3 mb-4">
                <div className="h-6 bg-white/20 rounded w-20"></div>
                <div className="h-6 bg-white/20 rounded w-24"></div>
              </div>
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
        <div className="grid md:grid-cols-3 gap-8 animate-pulse">
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="h-6 bg-gray-200 rounded mb-4 w-1/2"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="h-10 bg-gray-200 rounded mb-6"></div>
            <div className="h-[400px] bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
