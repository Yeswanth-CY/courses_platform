import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // First, get all modules with their course information
    const { data: modules, error: modulesError } = await supabase
      .from("modules")
      .select(`
        *,
        courses!inner(*)
      `)
      .order("order_index", { ascending: true })

    if (modulesError) {
      console.error("Error fetching modules:", modulesError)
      throw modulesError
    }

    if (!modules || modules.length === 0) {
      return NextResponse.json([])
    }

    // Then, get all videos for all modules in one query
    const moduleIds = modules.map((module) => module.id)
    const { data: videos, error: videosError } = await supabase
      .from("videos")
      .select("*")
      .in("module_id", moduleIds)
      .order("order_index", { ascending: true })

    if (videosError) {
      console.error("Error fetching videos:", videosError)
      // Don't throw error, just return modules without videos
    }

    // Group videos by module_id
    const videosByModule = (videos || []).reduce(
      (acc, video) => {
        if (!acc[video.module_id]) {
          acc[video.module_id] = []
        }
        acc[video.module_id].push(video)
        return acc
      },
      {} as Record<string, any[]>,
    )

    // Combine modules with their videos
    const modulesWithVideos = modules.map((module) => ({
      ...module,
      videos: videosByModule[module.id] || [],
    }))

    return NextResponse.json(modulesWithVideos)
  } catch (error) {
    console.error("Error in modules/with-videos:", error)

    // Check if it's a table missing error
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "42P01") {
        // Table doesn't exist
        return NextResponse.json({ error: "Database tables not found", code: "TABLES_MISSING" }, { status: 404 })
      }
    }

    return NextResponse.json({ error: "Failed to fetch modules with videos" }, { status: 500 })
  }
}
