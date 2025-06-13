import { NextResponse } from "next/server"
import { detectLanguageWithAI, processAllVideosWithAI, analyzeDetectionPatterns } from "@/lib/ai-language-detection"
import { supabase } from "@/lib/supabase"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const videoId = url.searchParams.get("videoId")
  const processAll = url.searchParams.get("processAll") === "true"
  const analyze = url.searchParams.get("analyze") === "true"

  try {
    if (analyze) {
      // Analyze detection patterns for insights
      const analysis = await analyzeDetectionPatterns()
      return NextResponse.json(analysis)
    } else if (processAll) {
      // Process all videos using multi-source context analysis
      console.log("Starting multi-source AI language detection for all videos...")
      const results = await processAllVideosWithAI()

      return NextResponse.json({
        success: true,
        message: "Multi-source AI detection completed",
        ...results,
        detectionMethod: "multi_source_context_analysis",
      })
    } else if (videoId) {
      // Process a single video with full context analysis
      const { data: video, error } = await supabase
        .from("videos")
        .select(`
          id, 
          title, 
          topic, 
          summary,
          module:modules(
            title,
            description,
            course:courses(
              title,
              description,
              primary_language
            )
          )
        `)
        .eq("id", videoId)
        .single()

      if (error || !video) {
        return NextResponse.json({ error: "Video not found" }, { status: 404 })
      }

      console.log(`Running multi-source AI detection for: ${video.title}`)
      const detectionResult = await detectLanguageWithAI(video)

      // Update the video with comprehensive detection results
      const { error: updateError } = await supabase
        .from("videos")
        .update({
          programming_language: detectionResult.detectedLanguage,
          content_type: detectionResult.suggestedContentType,
          ai_detection_result: {
            confidence: detectionResult.confidence,
            reasoning: detectionResult.reasoning,
            alternativeLanguages: detectionResult.alternativeLanguages,
            contextSources: detectionResult.contextSources,
            detectedAt: new Date().toISOString(),
            detectionMethod: "multi_source_context_analysis",
          },
        })
        .eq("id", videoId)

      if (updateError) {
        console.error("Error updating video:", updateError)
        return NextResponse.json({ error: "Failed to update video" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        videoId,
        detectionMethod: "multi_source_context_analysis",
        ...detectionResult,
      })
    } else {
      return NextResponse.json(
        {
          error: "Missing required parameter",
          usage: "?videoId=<id> | ?processAll=true | ?analyze=true",
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Error in AI language detection API:", error)
    return NextResponse.json(
      {
        error: "AI language detection failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { videoIds } = body

    if (!Array.isArray(videoIds)) {
      return NextResponse.json({ error: "videoIds must be an array" }, { status: 400 })
    }

    const results = []
    let processed = 0
    let updated = 0
    let failed = 0

    for (const videoId of videoIds) {
      try {
        processed++

        // Fetch video with full context
        const { data: video, error } = await supabase
          .from("videos")
          .select(`
            id, 
            title, 
            topic, 
            summary,
            module:modules(
              title,
              description,
              course:courses(
                title,
                description,
                primary_language
              )
            )
          `)
          .eq("id", videoId)
          .single()

        if (error || !video) {
          failed++
          results.push({ videoId, error: "Video not found" })
          continue
        }

        // Run AI detection with multi-source analysis
        const detectionResult = await detectLanguageWithAI(video)

        // Update database
        const { error: updateError } = await supabase
          .from("videos")
          .update({
            programming_language: detectionResult.detectedLanguage,
            content_type: detectionResult.suggestedContentType,
            ai_detection_result: {
              confidence: detectionResult.confidence,
              reasoning: detectionResult.reasoning,
              alternativeLanguages: detectionResult.alternativeLanguages,
              contextSources: detectionResult.contextSources,
              detectedAt: new Date().toISOString(),
              detectionMethod: "multi_source_context_analysis",
            },
          })
          .eq("id", videoId)

        if (updateError) {
          failed++
          results.push({ videoId, error: "Update failed" })
        } else {
          updated++
          results.push({ videoId, ...detectionResult })
        }

        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, 200))
      } catch (videoError) {
        failed++
        results.push({ videoId, error: "Processing failed" })
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      updated,
      failed,
      results,
      detectionMethod: "multi_source_context_analysis",
    })
  } catch (error) {
    console.error("Error in batch AI detection:", error)
    return NextResponse.json({ error: "Batch detection failed" }, { status: 500 })
  }
}
