import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const { data: modules, error } = await supabase
      .from("modules")
      .select(`
        *,
        courses!inner(*)
      `)
      .order("order_index", { ascending: true })

    if (error) throw error

    return NextResponse.json(modules)
  } catch (error) {
    console.error("Error fetching modules:", error)
    return NextResponse.json({ error: "Failed to fetch modules" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { course_id, title, description, order_index } = await request.json()

    // Validate that the course exists
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("id", course_id)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    const { data: module, error } = await supabase
      .from("modules")
      .insert({
        course_id,
        title,
        description,
        order_index,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating module:", error)
      throw error
    }

    return NextResponse.json({ ...module, videos: [] })
  } catch (error) {
    console.error("Error creating module:", error)
    return NextResponse.json({ error: "Failed to create module" }, { status: 500 })
  }
}
