"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, ArrowLeft, AlertCircle, Play, CheckCircle, Loader2, Sparkles, Home } from "lucide-react"
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
import { XpProgress } from "@/components/xp-progress"
import { useUser } from "@/contexts/user-context"
import { useProgress } from "@/hooks/use-progress"

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

export default function LearnPage() {
  const searchParams = useSearchParams()
  const videoId = searchParams.get("videoId")
  const moduleId = searchParams.get("moduleId")
  const { user, updateUser } = useUser()

  const [video, setVideo] = useState<any>(null)
  const [module, setModule] = useState<any>(null)
  const [learningContent, setLearningContent] = useState<LearningContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingContent, setLoadingContent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [xpEarned, setXpEarned] = useState(0)
  const [completedSections, setCompletedSections] = useState<string[]>([])
  const { toast } = useToast()
  const [currentLearning, setCurrentLearning] = useState<any>(null)

  const { markVideoStarted, markVideoCompleted, markSectionCompleted, markQuizCompleted, markChallengeCompleted } =
    useProgress()

  useEffect(() => {
    if (videoId) {
      fetchVideoData()
      fetchLearningContent()
    } else if (moduleId) {
      fetchModuleData()
    } else {
      setError("No video or module specified")
      setLoading(false)
    }
  }, [videoId, moduleId])

  // If no specific video/module, fetch user's current learning progress
  useEffect(() => {
    if (!videoId && !moduleId && user) {
      fetchCurrentLearning()
    }
  }, [user, videoId, moduleId])

  const fetchCurrentLearning = async () => {
    if (!user) return

    try {
      setLoading(true)
      const response = await fetch(`/api/progress/${user.id}/current`)

      if (response.ok) {
        const data = await response.json()
        setCurrentLearning(data)

        // If user has current progress, redirect to that content
        if (data.currentVideo) {
          const url = new URL(window.location.href)
          url.searchParams.set("videoId", data.currentVideo.id)
          if (data.currentModule) {
            url.searchParams.set("moduleId", data.currentModule.id)
          }
          window.history.replaceState({}, "", url.toString())

          setVideo(data.currentVideo)
          setModule(data.currentModule)
          fetchLearningContentForVideo(data.currentVideo.id)
        }
      }
    } catch (error) {
      console.error("Error fetching current learning:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchModuleData = async () => {
    if (!moduleId) return

    try {
      setLoading(true)
      setError(null)
      console.log("Fetching module data for ID:", moduleId)

      const response = await fetch(`/api/modules/by-id?id=${moduleId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Module not found")
      }

      console.log("Module data received:", data)
      setModule(data)

      if (data.videos && data.videos.length > 0) {
        setVideo(data.videos[0])
        // Update URL to include video ID
        const url = new URL(window.location.href)
        url.searchParams.set("videoId", data.videos[0].id)
        window.history.replaceState({}, "", url.toString())

        // Fetch learning content for the first video
        fetchLearningContentForVideo(data.videos[0].id)
      }
    } catch (error) {
      console.error("Error fetching module:", error)
      setError(`Failed to load module: ${error instanceof Error ? error.message : "Unknown error"}`)
      toast({
        title: "Error",
        description: "Failed to load module. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchVideoData = async () => {
    if (!videoId) return

    try {
      setLoading(true)
      setError(null)
      console.log("Fetching video data for ID:", videoId)

      const response = await fetch(`/api/videos/by-id?id=${videoId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Video not found")
      }

      console.log("Video data received:", data)
      setVideo(data)

      // If we have a moduleId, fetch module data too
      if (moduleId) {
        try {
          const moduleResponse = await fetch(`/api/modules/by-id?id=${moduleId}`)
          if (moduleResponse.ok) {
            const moduleData = await moduleResponse.json()
            setModule(moduleData)
          }
        } catch (moduleError) {
          console.warn("Could not fetch module data:", moduleError)
          // Don't fail the whole page if module fetch fails
        }
      }
    } catch (error) {
      console.error("Error fetching video:", error)
      setError(`Failed to load video: ${error instanceof Error ? error.message : "Unknown error"}`)
      toast({
        title: "Error",
        description: "Failed to load video. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchLearningContent = async () => {
    if (!videoId) return
    await fetchLearningContentForVideo(videoId)
  }

  const fetchLearningContentForVideo = async (vId: string) => {
    try {
      setLoadingContent(true)
      const response = await fetch(`/api/learning-content/${vId}`)

      if (response.ok) {
        const data = await response.json()
        setLearningContent(data)
      } else {
        console.log("No existing learning content found")
      }
    } catch (error) {
      console.error("Error fetching learning content:", error)
    } finally {
      setLoadingContent(false)
    }
  }

  const generateLearningContent = async () => {
    if (!videoId) return

    try {
      setLoadingContent(true)
      toast({
        title: "Generating AI Content",
        description: "Creating personalized learning materials...",
      })

      const response = await fetch(`/api/learning-content/${videoId}`, {
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

  const trackAction = async (actionType: string, xpGained: number) => {
    if (!user) return

    try {
      const response = await fetch("/api/user-actions/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          actionType,
          xpGained,
          metadata: {
            videoId,
            moduleId: moduleId || video?.modules?.id,
            courseId: module?.courses?.id || video?.modules?.courses?.id,
          },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        updateUser({ ...user, xp: data.newXp })

        toast({
          title: "XP Earned!",
          description: `+${xpGained} XP for ${actionType.replace("_", " ")}`,
        })
      }
    } catch (error) {
      console.error("Error tracking action:", error)
    }
  }

  const handleSectionComplete = async (sectionName: string, xpGained = 10) => {
    if (!completedSections.includes(sectionName) && videoId && user) {
      setCompletedSections([...completedSections, sectionName])
      setXpEarned((prev) => prev + xpGained)

      await markSectionCompleted(
        videoId,
        moduleId || video?.modules?.id,
        module?.courses?.id || video?.modules?.courses?.id,
        xpGained,
      )
    }
  }

  const updateVideoProgress = async (completed = true) => {
    if (!videoId || !user) return

    try {
      if (completed) {
        await markVideoCompleted(
          videoId,
          moduleId || video?.modules?.id,
          module?.courses?.id || video?.modules?.courses?.id,
        )
      }

      toast({
        title: "Progress Saved!",
        description: `You've earned ${xpEarned} total XP for this lesson.`,
      })
    } catch (error) {
      console.error("Error updating progress:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-600" />
            <Sparkles className="w-6 h-6 absolute -top-1 -right-1 text-yellow-500 animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Learning Experience</h2>
          <p className="text-gray-600">Preparing your personalized content...</p>
        </div>
      </div>
    )
  }

  if (error || (!video && !currentLearning && !loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl max-w-md mx-4">
          {currentLearning && !currentLearning.currentVideo ? (
            <>
              <Brain className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Ready to Learn!</h3>
              <p className="text-gray-600 mb-6">Start your learning journey by choosing a course.</p>
              <div className="space-y-3">
                <Link href="/courses">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">Browse Courses</Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    <Home className="w-4 h-4 mr-2" />
                    Back to Feed
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Content Not Found</h3>
              <p className="text-gray-600 mb-6">{error || "The content you're looking for doesn't exist."}</p>
              <div className="space-y-3">
                <Link href="/">
                  <Button className="w-full">
                    <Home className="w-4 h-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
                <Link href="/courses">
                  <Button variant="outline" className="w-full">
                    Browse Courses
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header with XP Progress */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-4">
            <Link href="/" className="text-white/80 hover:text-white flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Feed
            </Link>
            {user && <XpProgress currentXp={user.xp} />}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-3">
                {module && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-none">
                    {module.title}
                  </Badge>
                )}
                {video && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-none">
                    {video.topic}
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl font-bold mb-3">{video?.title || "Loading..."}</h1>
              <p className="text-lg opacity-90">{video?.summary || "Learn with AI-powered content"}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
              <h3 className="text-lg font-bold mb-3">Learning Progress</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sections Completed</span>
                  <span>{completedSections.length}/7</span>
                </div>
                <Progress value={(completedSections.length / 7) * 100} className="h-2 bg-white/20" />
                <div className="text-sm opacity-90">XP Earned: {xpEarned}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {video ? (
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
                    {video?.video_url ? (
                      <VideoPlayer
                        videoUrl={video.video_url}
                        title={video.title}
                        topic={video.topic}
                        summary={video.summary}
                        className="w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white">
                        <Loader2 className="w-8 h-8 animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold mb-2">{video?.title || "Loading..."}</h2>
                        <p className="text-gray-600 mb-4">{video?.summary || "Educational video content"}</p>
                      </div>
                      <Button
                        onClick={() => {
                          handleSectionComplete("video-watched", 20)
                          updateVideoProgress()
                        }}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={completedSections.includes("video-watched")}
                      >
                        {completedSections.includes("video-watched") ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Completed
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark Complete
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {video?.topic && <Badge variant="outline">{video.topic}</Badge>}
                      <Badge variant="outline">Educational</Badge>
                      {completedSections.includes("video-watched") && (
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
              <div className="space-y-8">
                {loadingContent ? (
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-12 text-center">
                      <div className="relative">
                        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-600" />
                        <Sparkles className="w-6 h-6 absolute -top-1 -right-1 text-yellow-500 animate-pulse" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-800 mb-2">Generating Learning Content</h2>
                      <p className="text-gray-600">
                        Creating AI-powered learning materials specifically for this video...
                      </p>
                    </CardContent>
                  </Card>
                ) : learningContent ? (
                  <>
                    <NotesSlides
                      notes={learningContent.notes}
                      onComplete={() => handleSectionComplete("notes", 15)}
                      completed={completedSections.includes("notes")}
                    />

                    <SimpleExplanation
                      title={learningContent.simpleExplanation.title}
                      explanation={learningContent.simpleExplanation.explanation}
                      keyPoints={learningContent.simpleExplanation.keyPoints}
                      onComplete={() => handleSectionComplete("explanation", 10)}
                      completed={completedSections.includes("explanation")}
                    />

                    {learningContent.codeExamples && learningContent.codeExamples.length > 0 && (
                      <CodeExamples
                        examples={learningContent.codeExamples}
                        language={learningContent.detectedLanguage}
                        onComplete={() => handleSectionComplete("code-examples", 20)}
                        completed={completedSections.includes("code-examples")}
                      />
                    )}

                    {learningContent.practicalExamples && learningContent.practicalExamples.length > 0 && (
                      <PracticalExamples
                        examples={learningContent.practicalExamples}
                        topic={video?.title || "Learning Topic"}
                        onComplete={() => handleSectionComplete("practical-examples", 15)}
                        completed={completedSections.includes("practical-examples")}
                      />
                    )}

                    <div className="bg-gradient-to-br from-amber-100 to-yellow-100 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                        💡 Learning Analogy
                        <Sparkles className="w-4 h-4 text-yellow-600" />
                      </h3>
                      <p className="text-gray-700 leading-relaxed mb-4">{learningContent.analogy}</p>
                      {!completedSections.includes("analogy") && (
                        <Button
                          onClick={() => handleSectionComplete("analogy", 5)}
                          size="sm"
                          className="bg-yellow-600 hover:bg-yellow-700"
                        >
                          Mark as Read (+5 XP)
                        </Button>
                      )}
                    </div>

                    <QuizFlash
                      questions={learningContent.questions}
                      onComplete={(score) => handleSectionComplete("quiz", score * 5)}
                      completed={completedSections.includes("quiz")}
                    />

                    <FlashcardSet
                      flashcards={learningContent.flashcards}
                      onComplete={() => handleSectionComplete("flashcards", 10)}
                      completed={completedSections.includes("flashcards")}
                    />

                    <Glossary
                      terms={learningContent.glossary}
                      onComplete={() => handleSectionComplete("glossary", 5)}
                      completed={completedSections.includes("glossary")}
                    />

                    <ChallengeInput
                      topic={learningContent.challengePrompt}
                      onSubmit={() => handleSectionComplete("challenge", 25)}
                      completed={completedSections.includes("challenge")}
                    />

                    {completedSections.length === 7 && (
                      <Card className="border-0 shadow-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                        <CardContent className="p-8 text-center">
                          <div className="text-6xl mb-4">🎉</div>
                          <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
                          <p className="text-lg mb-4">You've completed all sections and earned {xpEarned} XP!</p>
                          <Button
                            onClick={() => updateVideoProgress()}
                            className="bg-white text-green-600 hover:bg-gray-100"
                          >
                            Save Progress & Continue
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-12 text-center">
                      <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-600 mb-2">No AI Content Available</h3>
                      <p className="text-gray-500 mb-6">
                        AI learning content for this video hasn't been generated yet.
                      </p>
                      <Button onClick={generateLearningContent} className="bg-purple-600 hover:bg-purple-700">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate AI Content
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
            <p className="text-gray-600">Loading your learning content...</p>
          </div>
        )}
      </div>
    </div>
  )
}
