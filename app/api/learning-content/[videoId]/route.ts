import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { generateVideoLearningContent } from "@/lib/gemini"

export async function GET(request: NextRequest, { params }: { params: { videoId: string } }) {
  try {
    const { videoId } = params

    if (!videoId) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 })
    }

    // First check if content already exists for this specific video
    const { data: existingContent } = await supabase
      .from("learning_content")
      .select("*")
      .eq("video_id", videoId)
      .single()

    if (existingContent) {
      console.log("Returning existing content for video:", videoId)
      return NextResponse.json(existingContent.content)
    }

    // Get video details with module and course info
    const { data: video, error: videoError } = await supabase
      .from("videos")
      .select(`
        *,
        modules!inner(
          *,
          courses!inner(*)
        )
      `)
      .eq("id", videoId)
      .single()

    if (videoError || !video) {
      console.error("Video not found:", videoError)
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    // Create context for language detection
    const detectionContext = {
      courseTitle: video.modules.courses.title,
      moduleTitle: video.modules.title,
      videoTitle: video.title,
      videoSummary: video.summary || "",
      coursePrimaryLanguage: video.modules.courses.primary_language,
      videoProgrammingLanguage: video.programming_language,
    }

    console.log("Generating new content for video:", video.title)

    // Generate new content using AI based on the specific video
    const content = await generateVideoLearningContent(
      video.title,
      video.topic,
      video.summary || "",
      video.modules.title,
      video.modules.courses.title,
      detectionContext,
    )

    console.log("Content generated successfully for video:", videoId)

    // Determine detection confidence based on available context
    let detectionConfidence: "high" | "medium" | "low" = "low"

    if (video.modules.courses.primary_language || video.programming_language) {
      detectionConfidence = "high"
    } else if (
      video.modules.courses.title.match(/(Python|JavaScript|Java|C\+\+|C#|Ruby|Go|Rust|PHP|TypeScript)/i) ||
      video.modules.title.match(/(Python|JavaScript|Java|C\+\+|C#|Ruby|Go|Rust|PHP|TypeScript)/i)
    ) {
      detectionConfidence = "medium"
    }

    // Save generated content with enhanced context information
    const { error: insertError } = await supabase.from("learning_content").insert({
      video_id: videoId,
      module_id: video.module_id,
      content: {
        ...content,
        contextSource: {
          courseTitle: video.modules.courses.title,
          moduleTitle: video.modules.title,
          videoTitle: video.title,
          detectionConfidence,
        },
      },
      detected_language: content.detectedLanguage || null,
      content_type: content.contentType || "general",
      generation_context: {
        video_language: video.programming_language,
        course_language: video.modules.courses.primary_language,
        course_type: video.modules.courses.course_type,
        video_content_type: video.content_type,
        detection_confidence: detectionConfidence,
        context_sources: detectionContext,
        generation_timestamp: new Date().toISOString(),
      },
    })

    if (insertError) {
      console.error("Error saving content:", insertError)
      // Don't fail the request if saving fails, just log it
    }

    // Update the video with detected language if not already set
    if (content.detectedLanguage && !video.programming_language) {
      await supabase
        .from("videos")
        .update({
          programming_language: content.detectedLanguage,
          content_type: content.contentType || "general",
        })
        .eq("id", videoId)
    }

    return NextResponse.json({
      ...content,
      contextSource: {
        courseTitle: video.modules.courses.title,
        moduleTitle: video.modules.title,
        videoTitle: video.title,
        detectionConfidence,
      },
    })
  } catch (error) {
    console.error("Error in learning content API:", error)

    // Return a more detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("Detailed error:", errorMessage)

    // Return fallback content instead of error
    return NextResponse.json({
      notes: [
        {
          id: 1,
          title: "Content Loading",
          content: "Learning content is being prepared. Please try refreshing the page.",
          illustration: "📚",
        },
      ],
      simpleExplanation: {
        title: "Learning Overview",
        explanation: "This content provides educational materials for your learning journey.",
        keyPoints: ["Learn key concepts", "Practice with examples", "Apply knowledge"],
      },
      questions: [
        {
          id: 1,
          question: "What is the main focus of this lesson?",
          options: ["Learning new concepts", "General knowledge", "Entertainment", "None of the above"],
          correctAnswer: 0,
          explanation: "The main focus is learning new concepts and skills.",
        },
      ],
      flashcards: [
        {
          id: 1,
          term: "Learning",
          definition: "The process of acquiring new knowledge and skills.",
        },
      ],
      glossary: [
        {
          term: "Education",
          definition: "The process of facilitating learning and knowledge acquisition.",
        },
      ],
      analogy: "Learning is like building a house - you start with a foundation and build up step by step.",
      challengePrompt: "Apply what you learn by practicing with real examples and projects.",
      contentType: "general" as const,
    })
  }
}

export async function POST(request: NextRequest, { params }: { params: { videoId: string } }) {
  try {
    const { videoId } = params
    const body = await request.json()
    const { forceRegenerate } = body

    if (forceRegenerate) {
      // Delete existing content to force regeneration
      await supabase.from("learning_content").delete().eq("video_id", videoId)
    }

    // Call the GET method to generate new content
    return GET(request, { params })
  } catch (error) {
    console.error("Error in POST request:", error)
    return NextResponse.json({ error: "Failed to regenerate content" }, { status: 500 })
  }
}
