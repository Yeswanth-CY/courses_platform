import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    // Get all courses with their modules and videos
    const { data: courses, error: coursesError } = await supabase
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
      .order("created_at", { ascending: true })

    if (coursesError) {
      console.error("Error fetching courses:", coursesError)
      return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 })
    }

    if (!courses) {
      return NextResponse.json({ courses: [] })
    }

    // Calculate REAL progress for each course if user is provided
    const coursesWithProgress = await Promise.all(
      courses.map(async (course) => {
        let progressPercentage = 0
        let completedVideos = 0
        let totalVideos = 0

        // Count total videos in course
        if (course.modules) {
          totalVideos = course.modules.reduce((total: number, module: any) => {
            return total + (module.videos?.length || 0)
          }, 0)
        }

        // If user is logged in, calculate their REAL progress
        if (userId && totalVideos > 0) {
          const { data: userProgress } = await supabase
            .from("user_progress")
            .select("completed")
            .eq("user_id", userId)
            .eq("course_id", course.id)
            .eq("completed", true)

          completedVideos = userProgress?.length || 0
          progressPercentage = Math.round((completedVideos / totalVideos) * 100)
        }

        return {
          ...course,
          stats: {
            totalModules: course.modules?.length || 0,
            totalVideos,
            completedVideos,
            progressPercentage,
            // Remove fake ratings - set to 0 until we have real ratings
            averageRating: 0,
            totalRatings: 0,
            // Remove fake student counts - set to 0 until we have real enrollment
            enrolledStudents: 0,
          },
        }
      }),
    )

    return NextResponse.json({ courses: coursesWithProgress })
  } catch (error) {
    console.error("Error in courses API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
