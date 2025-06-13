import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { generateLearningContent } from "@/lib/gemini"

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Module ID is required" }, { status: 400 })
    }

    // Get module with videos
    const { data: module, error: moduleError } = await supabase
      .from("modules")
      .select(`
        *,
        videos(*)
      `)
      .eq("id", id)
      .single()

    if (moduleError || !module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    // Check if we have existing learning content for this module
    const { data: existingContent, error: contentError } = await supabase
      .from("learning_content")
      .select("*")
      .eq("module_id", id)
      .single()

    if (existingContent && !contentError) {
      return NextResponse.json(existingContent.content)
    }

    // If no existing content, generate new content based on module info
    const moduleContext = {
      title: module.title,
      description: module.description,
      videos: module.videos || [],
    }

    const learningContent = await generateLearningContent(
      `Module: ${module.title}. ${module.description}. Contains ${module.videos?.length || 0} videos.`,
      "general",
      "beginner",
    )

    // Save the generated content
    const { error: saveError } = await supabase.from("learning_content").insert({
      module_id: id,
      content: learningContent,
      content_type: "module",
    })

    if (saveError) {
      console.error("Error saving learning content:", saveError)
    }

    return NextResponse.json(learningContent)
  } catch (error) {
    console.error("Error generating module learning content:", error)
    return NextResponse.json({ error: "Failed to generate learning content" }, { status: 500 })
  }
}
