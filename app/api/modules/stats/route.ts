import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const moduleId = url.searchParams.get("id")
    const userId = url.searchParams.get("userId")

    if (!moduleId) {
      return NextResponse.json({ error: "Module ID is required" }, { status: 400 })
    }

    console.log("Fetching module stats for:", moduleId, "user:", userId)

    // Get module with videos and course info
    const { data: modules, error: moduleError } = await supabase
      .from("modules")
      .select(`
        *,
        courses (
          id,
          title,
          description,
          primary_language
        ),
        videos (
          id,
          title,
          summary,
          topic,
          video_url,
          order_index,
          programming_language,
          content_type
        )
      `)
      .eq("id", moduleId)

    if (moduleError) {
      console.error("Supabase error fetching module:", moduleError)
      return NextResponse.json({ error: "Database error occurred" }, { status: 500 })
    }

    if (!modules || modules.length === 0) {
      console.log("No module found with ID:", moduleId)
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    const module = modules[0]

    // Get user progress if userId is provided
    let userProgress = []
    if (userId) {
      const { data: progressData, error: progressError } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("module_id", moduleId)

      if (!progressError && progressData) {
        userProgress = progressData
      }
    }

    // Calculate stats
    const totalVideos = module.videos?.length || 0
    const completedVideos = userProgress.filter((p) => p.completed).length
    const progressPercentage = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0
    const estimatedTime = totalVideos * 10 // Estimate 10 minutes per video

    const stats = {
      totalVideos,
      completedVideos,
      progressPercentage,
      estimatedTime,
    }

    console.log("Module stats calculated:", stats)

    return NextResponse.json({
      module,
      stats,
      userProgress,
    })
  } catch (error) {
    console.error("Error in module stats API:", error)
    return NextResponse.json({ error: "Failed to fetch module stats" }, { status: 500 })
  }
}
