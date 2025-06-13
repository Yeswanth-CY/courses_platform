import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    // Get course with modules and videos
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select(`
        *,
        modules (
          id,
          title,
          description,
          order_index,
          videos (
            id,
            title,
            topic,
            order_index
          )
        )
      `)
      .eq("id", params.courseId)
      .single()

    if (courseError) {
      console.error("Error fetching course:", courseError)
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Calculate REAL stats
    const totalModules = course.modules?.length || 0
    const totalVideos =
      course.modules?.reduce((total: number, module: any) => {
        return total + (module.videos?.length || 0)
      }, 0) || 0

    let completedVideos = 0
    let completedModules = 0
    let progressPercentage = 0

    // If user is provided, calculate their REAL progress
    if (userId && totalVideos > 0) {
      // Get user's completed videos for this course
      const { data: userProgress } = await supabase
        .from("user_progress")
        .select("video_id, module_id, completed")
        .eq("user_id", userId)
        .eq("course_id", params.courseId)
        .eq("completed", true)

      completedVideos = userProgress?.length || 0
      progressPercentage = Math.round((completedVideos / totalVideos) * 100)

      // Calculate completed modules (a module is complete if ALL its videos are complete)
      if (course.modules) {
        for (const module of course.modules) {
          const moduleVideoIds = module.videos?.map((v: any) => v.id) || []
          const completedModuleVideos = userProgress?.filter((p) => moduleVideoIds.includes(p.video_id)) || []

          if (moduleVideoIds.length > 0 && completedModuleVideos.length === moduleVideoIds.length) {
            completedModules++
          }
        }
      }
    }

    const stats = {
      totalModules,
      totalVideos,
      completedVideos,
      completedModules,
      progressPercentage,
      // Remove fake ratings - set to 0 until we have real ratings
      averageRating: 0,
      totalRatings: 0,
    }

    return NextResponse.json({
      course,
      stats,
    })
  } catch (error) {
    console.error("Error in course stats API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
