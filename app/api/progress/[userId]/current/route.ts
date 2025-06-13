import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get user's most recent progress
    const { data: recentProgress, error: progressError } = await supabase
      .from("user_progress")
      .select(`
        *,
        videos (
          id,
          title,
          video_url,
          topic,
          summary,
          modules (
            id,
            title,
            description,
            courses (
              id,
              title,
              description
            )
          )
        )
      `)
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single()

    if (progressError && progressError.code !== "PGRST116") {
      console.error("Error fetching recent progress:", progressError)
    }

    // If no recent progress, get the first available course/module/video
    if (!recentProgress) {
      const { data: firstVideo, error: videoError } = await supabase
        .from("videos")
        .select(`
          id,
          title,
          video_url,
          topic,
          summary,
          modules (
            id,
            title,
            description,
            courses (
              id,
              title,
              description
            )
          )
        `)
        .limit(1)
        .single()

      if (videoError) {
        console.error("Error fetching first video:", videoError)
        return NextResponse.json({
          currentVideo: null,
          currentModule: null,
          currentCourse: null,
          message: "No content available",
        })
      }

      return NextResponse.json({
        currentVideo: firstVideo,
        currentModule: firstVideo.modules,
        currentCourse: firstVideo.modules?.courses,
        isNew: true,
      })
    }

    // Get user's overall progress stats
    const { data: progressStats } = await supabase
      .from("user_progress")
      .select("completed, progress_percentage")
      .eq("user_id", userId)

    const totalVideos = progressStats?.length || 0
    const completedVideos = progressStats?.filter((p) => p.completed).length || 0
    const averageProgress = progressStats?.reduce((acc, p) => acc + (p.progress_percentage || 0), 0) / totalVideos || 0

    return NextResponse.json({
      currentVideo: recentProgress.videos,
      currentModule: recentProgress.videos?.modules,
      currentCourse: recentProgress.videos?.modules?.courses,
      progressStats: {
        totalVideos,
        completedVideos,
        averageProgress: Math.round(averageProgress),
        lastWatched: recentProgress.updated_at,
      },
      isNew: false,
    })
  } catch (error) {
    console.error("Error in current progress API:", error)
    return NextResponse.json({ error: "Failed to fetch current learning progress" }, { status: 500 })
  }
}
