import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { moduleId: string } }) {
  try {
    const { moduleId } = params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    // First, get the module with its videos
    const { data: module, error: moduleError } = await supabase
      .from("modules")
      .select(`
        *,
        videos (*)
      `)
      .eq("id", moduleId)
      .single()

    if (moduleError) {
      console.error("Error fetching module:", moduleError)
      throw moduleError
    }

    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    // Get course information separately
    const { data: course } = await supabase.from("courses").select("*").eq("id", module.course_id).single()

    // Attach course to module
    module.course = course

    // Calculate stats
    const totalVideos = module.videos?.length || 0
    let completedVideos = 0
    let userProgress = []

    // Get user progress if userId is provided
    if (userId && totalVideos > 0) {
      const { data: progress } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("module_id", moduleId)

      userProgress = progress || []
      completedVideos = userProgress.filter((p: any) => p.completed).length
    }

    const progressPercentage = totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0

    const stats = {
      totalVideos,
      completedVideos,
      progressPercentage,
      estimatedTime: totalVideos * 15,
    }

    return NextResponse.json({
      module,
      stats,
      userProgress,
    })
  } catch (error) {
    console.error("Error fetching module stats:", error)
    return NextResponse.json({ error: "Failed to fetch module stats" }, { status: 500 })
  }
}
