import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createClient()

    const { data: videos, error } = await supabase.from("videos").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching videos:", error)

      // Return demo videos if database query fails
      return NextResponse.json(
        [
          {
            id: "demo1",
            title: "Learn Python - Full Course for Beginners",
            description:
              "This course will give you a full introduction to Python programming. Follow along with the videos and you'll be a Python programmer in no time!",
            video_url: "https://www.youtube.com/watch?v=rfscVS0vtbw",
            thumbnail_url: "https://i.ytimg.com/vi/rfscVS0vtbw/maxresdefault.jpg",
            likes_count: 1200,
            views_count: 45000,
            created_at: new Date().toISOString(),
          },
          {
            id: "demo2",
            title: "JavaScript Crash Course For Beginners",
            description:
              "In this crash course we will go over the fundamentals of JavaScript including variables, data types, loops, conditionals, functions and more.",
            video_url: "https://www.youtube.com/watch?v=hdI2bqOjy3c",
            thumbnail_url: "https://i.ytimg.com/vi/hdI2bqOjy3c/maxresdefault.jpg",
            likes_count: 980,
            views_count: 32000,
            created_at: new Date().toISOString(),
          },
        ],
        { status: 200 },
      )
    }

    // If no videos in database, return demo videos
    if (!videos || videos.length === 0) {
      return NextResponse.json(
        [
          {
            id: "demo1",
            title: "Learn Python - Full Course for Beginners",
            description:
              "This course will give you a full introduction to Python programming. Follow along with the videos and you'll be a Python programmer in no time!",
            video_url: "https://www.youtube.com/watch?v=rfscVS0vtbw",
            thumbnail_url: "https://i.ytimg.com/vi/rfscVS0vtbw/maxresdefault.jpg",
            likes_count: 1200,
            views_count: 45000,
            created_at: new Date().toISOString(),
          },
          {
            id: "demo2",
            title: "JavaScript Crash Course For Beginners",
            description:
              "In this crash course we will go over the fundamentals of JavaScript including variables, data types, loops, conditionals, functions and more.",
            video_url: "https://www.youtube.com/watch?v=hdI2bqOjy3c",
            thumbnail_url: "https://i.ytimg.com/vi/hdI2bqOjy3c/maxresdefault.jpg",
            likes_count: 980,
            views_count: 32000,
            created_at: new Date().toISOString(),
          },
        ],
        { status: 200 },
      )
    }

    return NextResponse.json(videos, { status: 200 })
  } catch (error) {
    console.error("Error in videos API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
