import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 })
    }

    console.log("Fetching video with ID:", id)

    // Get video with module info - handle both single and multiple results
    const { data: videos, error } = await supabase
      .from("videos")
      .select(`
        *,
        modules (
          id,
          title,
          description,
          courses (
            id,
            title
          )
        )
      `)
      .eq("id", id)

    if (error) {
      console.error("Supabase error fetching video:", error)
      return NextResponse.json({ error: "Database error occurred" }, { status: 500 })
    }

    if (!videos || videos.length === 0) {
      console.log("No video found with ID:", id)
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    // Return the first video if multiple found
    const video = videos[0]
    console.log("Video found:", video.title)

    return NextResponse.json(video)
  } catch (error) {
    console.error("Error in video API:", error)
    return NextResponse.json({ error: "Failed to fetch video" }, { status: 500 })
  }
}
