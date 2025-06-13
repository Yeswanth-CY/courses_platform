import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { generateModuleLearningContent } from "@/lib/gemini"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // First check if content already exists
    const { data: existingContent } = await supabase
      .from("learning_content")
      .select("*")
      .eq("module_id", id)
      .is("video_id", null)
      .single()

    if (existingContent) {
      return NextResponse.json(existingContent.content)
    }

    // Get module details with course info
    const { data: module, error: moduleError } = await supabase
      .from("modules")
      .select(`
        *,
        courses!inner(*)
      `)
      .eq("id", id)
      .single()

    if (moduleError || !module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    // Get all videos for this module
    const { data: videos, error: videosError } = await supabase
      .from("videos")
      .select("*")
      .eq("module_id", id)
      .order("order_index", { ascending: true })

    if (videosError) {
      console.error("Error fetching videos:", videosError)
      return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 })
    }

    // Generate new content using AI
    const content = await generateModuleLearningContent(
      module.title,
      module.description || "",
      module.courses.title,
      videos || [],
    )

    // Save generated content with context information
    const { error: insertError } = await supabase.from("learning_content").insert({
      module_id: id,
      content,
      detected_language: content.detectedLanguage || null,
      content_type: content.contentType || "general",
      generation_context: {
        course_language: module.courses.primary_language,
        course_type: module.courses.course_type,
        video_count: videos?.length || 0,
        generation_timestamp: new Date().toISOString(),
      },
    })

    if (insertError) {
      console.error("Error saving content:", insertError)
    }

    return NextResponse.json(content)
  } catch (error) {
    console.error("Error generating module learning content:", error)
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 })
  }
}
