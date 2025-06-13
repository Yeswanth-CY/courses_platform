import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Module ID is required" }, { status: 400 })
    }

    console.log("Fetching module with ID:", id)

    // Get module with videos and course info
    const { data: modules, error } = await supabase
      .from("modules")
      .select(`
        *,
        courses (
          id,
          title,
          description
        ),
        videos (
          id,
          title,
          summary,
          topic,
          video_url
        )
      `)
      .eq("id", id)

    if (error) {
      console.error("Supabase error fetching module:", error)
      return NextResponse.json({ error: "Database error occurred" }, { status: 500 })
    }

    if (!modules || modules.length === 0) {
      console.log("No module found with ID:", id)
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    const module = modules[0]
    console.log("Module found:", module.title)

    return NextResponse.json(module)
  } catch (error) {
    console.error("Error in module API:", error)
    return NextResponse.json({ error: "Failed to fetch module" }, { status: 500 })
  }
}
