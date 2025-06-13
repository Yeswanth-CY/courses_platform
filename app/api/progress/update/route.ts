import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { userId, videoId, moduleId, courseId, completed } = await request.json()

    console.log("Progress update request:", { userId, videoId, moduleId, courseId, completed })

    if (!userId || !videoId) {
      return NextResponse.json({ error: "User ID and Video ID are required" }, { status: 400 })
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 })
    }

    // 1. Update the specific video progress
    const { error: updateError } = await supabase.from("user_progress").upsert(
      {
        user_id: userId,
        video_id: videoId,
        module_id: moduleId,
        course_id: courseId,
        completed: completed,
        progress_percentage: completed ? 100 : 0,
        last_watched_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,video_id",
      },
    )

    if (updateError) {
      console.error("Database error updating video progress:", updateError)
      return NextResponse.json({ error: `Database error: ${updateError.message}` }, { status: 500 })
    }

    // 2. Calculate REAL module progress from database
    const { data: moduleVideos, error: moduleVideosError } = await supabase
      .from("videos")
      .select("id")
      .eq("module_id", moduleId)

    if (moduleVideosError) {
      console.error("Error fetching module videos:", moduleVideosError)
      return NextResponse.json({ error: "Failed to fetch module videos" }, { status: 500 })
    }

    const { data: moduleProgress, error: moduleProgressError } = await supabase
      .from("user_progress")
      .select("video_id, completed")
      .eq("user_id", userId)
      .eq("module_id", moduleId)

    if (moduleProgressError) {
      console.error("Error fetching module progress:", moduleProgressError)
      return NextResponse.json({ error: "Failed to fetch module progress" }, { status: 500 })
    }

    const totalVideosInModule = moduleVideos?.length || 0
    const completedVideosInModule = moduleProgress?.filter((p) => p.completed).length || 0
    const moduleCompletionPercentage =
      totalVideosInModule > 0 ? Math.round((completedVideosInModule / totalVideosInModule) * 100) : 0

    // 3. Calculate REAL course progress from database
    const { data: courseVideos, error: courseVideosError } = await supabase
      .from("videos")
      .select("id")
      .in(
        "module_id",
        await supabase
          .from("modules")
          .select("id")
          .eq("course_id", courseId)
          .then((res) => res.data?.map((m) => m.id) || []),
      )

    if (courseVideosError) {
      console.error("Error fetching course videos:", courseVideosError)
      return NextResponse.json({ error: "Failed to fetch course videos" }, { status: 500 })
    }

    const { data: courseProgress, error: courseProgressError } = await supabase
      .from("user_progress")
      .select("video_id, completed")
      .eq("user_id", userId)
      .eq("course_id", courseId)

    if (courseProgressError) {
      console.error("Error fetching course progress:", courseProgressError)
      return NextResponse.json({ error: "Failed to fetch course progress" }, { status: 500 })
    }

    const totalVideosInCourse = courseVideos?.length || 0
    const completedVideosInCourse = courseProgress?.filter((p) => p.completed).length || 0
    const courseCompletionPercentage =
      totalVideosInCourse > 0 ? Math.round((completedVideosInCourse / totalVideosInCourse) * 100) : 0

    console.log("Calculated progress:", {
      module: {
        total: totalVideosInModule,
        completed: completedVideosInModule,
        percentage: moduleCompletionPercentage,
      },
      course: {
        total: totalVideosInCourse,
        completed: completedVideosInCourse,
        percentage: courseCompletionPercentage,
      },
    })

    return NextResponse.json({
      success: true,
      videoProgress: {
        videoId,
        completed,
      },
      moduleProgress: {
        moduleId,
        completedVideos: completedVideosInModule,
        totalVideos: totalVideosInModule,
        progressPercentage: moduleCompletionPercentage,
      },
      courseProgress: {
        courseId,
        completedVideos: completedVideosInCourse,
        totalVideos: totalVideosInCourse,
        progressPercentage: courseCompletionPercentage,
      },
    })
  } catch (error) {
    console.error("Error in progress update:", error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 },
    )
  }
}
