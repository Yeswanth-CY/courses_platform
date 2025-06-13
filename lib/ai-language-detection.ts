import { GoogleGenerativeAI } from "@google/generative-ai"
import { supabase } from "./supabase"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

interface VideoMetadata {
  id: string
  title: string
  topic: string
  summary: string
  module?: {
    title: string
    description: string
    course?: {
      title: string
      description: string
      primary_language?: string
    }
  }
}

interface LanguageDetectionResult {
  detectedLanguage: string | null
  confidence: "high" | "medium" | "low" | "unknown"
  reasoning: string
  isProgramming: boolean
  suggestedContentType: "programming" | "general"
  alternativeLanguages?: string[]
  contextSources: {
    courseTitle: string
    moduleTitle: string
    videoTitle: string
    videoSummary: string
    detectionSource: "course_context" | "module_context" | "video_context" | "summary_keywords" | "combined_analysis"
  }
}

/**
 * Uses AI to detect programming language using multi-source context analysis
 * Analyzes: Course Title → Module Title → Video Title → Video Summary
 */
export async function detectLanguageWithAI(videoMetadata: VideoMetadata): Promise<LanguageDetectionResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    // Multi-source context analysis prompt - exactly as described in the logic
    const prompt = `
      You are an expert AI system for detecting programming languages from educational content.
      
      Use MULTI-SOURCE CONTEXT DETECTION with the following priority analysis:
      
      1. COURSE TITLE ANALYSIS: "${videoMetadata.module?.course?.title || "Unknown"}"
      2. MODULE TITLE ANALYSIS: "${videoMetadata.module?.title || "Unknown"}"  
      3. VIDEO TITLE ANALYSIS: "${videoMetadata.title}"
      4. VIDEO SUMMARY ANALYSIS: "${videoMetadata.summary || "No summary available"}"
      
      Additional Context:
      - Course Description: "${videoMetadata.module?.course?.description || "Not available"}"
      - Module Description: "${videoMetadata.module?.description || "Not available"}"
      - Video Topic: "${videoMetadata.topic}"
      - Course Primary Language (if set): "${videoMetadata.module?.course?.primary_language || "Not specified"}"
      
      ANALYSIS INSTRUCTIONS:
      
      Step 1: Analyze the COURSE TITLE for programming language indicators
      - Look for explicit language names (Python, JavaScript, Java, etc.)
      - Consider course context and domain
      
      Step 2: Examine the MODULE TITLE for language-specific content
      - Check for language-specific terminology
      - Look for framework or library names
      
      Step 3: Consider the VIDEO TITLE for specific language references
      - Identify language-specific syntax or concepts
      - Look for version-specific references (ES6, Python 3, etc.)
      
      Step 4: Analyze VIDEO SUMMARY for language-specific keywords
      - Search for programming language names
      - Look for language-specific libraries, frameworks, or concepts
      - Consider code examples or syntax mentions
      
      Step 5: Determine the PRIMARY DETECTION SOURCE
      - Which source provided the strongest evidence?
      - How confident are you in this detection?
      
      IMPORTANT: Use ALL available context rather than just the video title!
      
      Examples of Multi-Source Detection:
      - Course: "Python Programming Fundamentals" + Video: "Variables and Data Types" = Python (High Confidence)
      - Course: "Web Development" + Module: "JavaScript Basics" + Video: "Functions" = JavaScript (High Confidence)  
      - Course: "Computer Science" + Video: "Variables and Data Types" = General Programming (Low Confidence)
      
      Respond in JSON format only:
      {
        "detectedLanguage": "specific language name or null",
        "confidence": "high/medium/low/unknown",
        "reasoning": "detailed explanation of your multi-source analysis",
        "isProgramming": true/false,
        "suggestedContentType": "programming/general",
        "alternativeLanguages": ["possible alternatives if uncertain"],
        "contextSources": {
          "courseTitle": "analysis of course title",
          "moduleTitle": "analysis of module title", 
          "videoTitle": "analysis of video title",
          "videoSummary": "analysis of video summary",
          "detectionSource": "primary source that led to detection"
        }
      }
      
      Be specific about programming languages (Python, JavaScript, Java, TypeScript, etc.).
      If multiple sources conflict, explain the reasoning and choose the most reliable source.
      If no clear language is detected, set detectedLanguage to null.
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text().trim()

    try {
      // Extract JSON from AI response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      const jsonText = jsonMatch ? jsonMatch[0] : text
      const detection = JSON.parse(jsonText) as LanguageDetectionResult

      // Validate and normalize the AI response
      return {
        detectedLanguage: detection.detectedLanguage,
        confidence: ["high", "medium", "low", "unknown"].includes(detection.confidence)
          ? (detection.confidence as "high" | "medium" | "low" | "unknown")
          : "unknown",
        reasoning: detection.reasoning || "AI analysis completed",
        isProgramming: !!detection.isProgramming,
        suggestedContentType: detection.suggestedContentType === "programming" ? "programming" : "general",
        alternativeLanguages: Array.isArray(detection.alternativeLanguages) ? detection.alternativeLanguages : [],
        contextSources: {
          courseTitle: detection.contextSources?.courseTitle || "No analysis",
          moduleTitle: detection.contextSources?.moduleTitle || "No analysis",
          videoTitle: detection.contextSources?.videoTitle || "No analysis",
          videoSummary: detection.contextSources?.videoSummary || "No analysis",
          detectionSource: detection.contextSources?.detectionSource || "combined_analysis",
        },
      }
    } catch (parseError) {
      console.error("Error parsing AI language detection response:", parseError)
      console.log("Raw AI response:", text)

      return {
        detectedLanguage: null,
        confidence: "unknown",
        reasoning: "Failed to parse AI response - response format was invalid",
        isProgramming: false,
        suggestedContentType: "general",
        contextSources: {
          courseTitle: "Parse error",
          moduleTitle: "Parse error",
          videoTitle: "Parse error",
          videoSummary: "Parse error",
          detectionSource: "combined_analysis",
        },
      }
    }
  } catch (error) {
    console.error("AI language detection error:", error)
    return {
      detectedLanguage: null,
      confidence: "unknown",
      reasoning: "AI detection service unavailable",
      isProgramming: false,
      suggestedContentType: "general",
      contextSources: {
        courseTitle: "Service error",
        moduleTitle: "Service error",
        videoTitle: "Service error",
        videoSummary: "Service error",
        detectionSource: "combined_analysis",
      },
    }
  }
}

/**
 * Processes all videos using AI multi-source context detection
 */
export async function processAllVideosWithAI(): Promise<{
  processed: number
  updated: number
  failed: number
  results: Record<string, LanguageDetectionResult>
  detectionSummary: {
    courseContext: number
    moduleContext: number
    videoContext: number
    summaryKeywords: number
    combinedAnalysis: number
  }
}> {
  const results: Record<string, LanguageDetectionResult> = {}
  const detectionSummary = {
    courseContext: 0,
    moduleContext: 0,
    videoContext: 0,
    summaryKeywords: 0,
    combinedAnalysis: 0,
  }

  let processed = 0
  let updated = 0
  let failed = 0

  try {
    // Fetch all videos with complete context for multi-source analysis
    const { data: videos, error } = await supabase.from("videos").select(`
        id, 
        title, 
        topic, 
        summary,
        programming_language,
        content_type,
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

    if (error) {
      throw error
    }

    if (!videos || videos.length === 0) {
      return { processed: 0, updated: 0, failed: 0, results, detectionSummary }
    }

    console.log(`Starting AI detection for ${videos.length} videos using multi-source context analysis...`)

    // Process each video with comprehensive context analysis
    for (const video of videos) {
      try {
        processed++
        console.log(`Processing video ${processed}/${videos.length}: ${video.title}`)

        const detectionResult = await detectLanguageWithAI(video)
        results[video.id] = detectionResult

        // Track detection source statistics
        switch (detectionResult.contextSources.detectionSource) {
          case "course_context":
            detectionSummary.courseContext++
            break
          case "module_context":
            detectionSummary.moduleContext++
            break
          case "video_context":
            detectionSummary.videoContext++
            break
          case "summary_keywords":
            detectionSummary.summaryKeywords++
            break
          default:
            detectionSummary.combinedAnalysis++
        }

        // Update database with AI detection results
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
          .eq("id", video.id)

        if (updateError) {
          console.error(`Error updating video ${video.id}:`, updateError)
          failed++
        } else {
          updated++
          console.log(
            `✓ Updated ${video.title} - Language: ${detectionResult.detectedLanguage || "None"} (${detectionResult.confidence})`,
          )
        }
      } catch (videoError) {
        console.error(`Error processing video ${video.id}:`, videoError)
        failed++
      }

      // Rate limiting to avoid API limits
      await new Promise((resolve) => setTimeout(resolve, 300))
    }

    console.log("AI Detection Summary:")
    console.log(`- Total Processed: ${processed}`)
    console.log(`- Successfully Updated: ${updated}`)
    console.log(`- Failed: ${failed}`)
    console.log("Detection Sources:")
    console.log(`- Course Context: ${detectionSummary.courseContext}`)
    console.log(`- Module Context: ${detectionSummary.moduleContext}`)
    console.log(`- Video Context: ${detectionSummary.videoContext}`)
    console.log(`- Summary Keywords: ${detectionSummary.summaryKeywords}`)
    console.log(`- Combined Analysis: ${detectionSummary.combinedAnalysis}`)

    return { processed, updated, failed, results, detectionSummary }
  } catch (error) {
    console.error("Error in processAllVideosWithAI:", error)
    return { processed, updated, failed, results, detectionSummary }
  }
}

/**
 * Analyzes detection patterns to improve future AI prompts
 */
export async function analyzeDetectionPatterns(): Promise<{
  totalVideos: number
  languageDistribution: Record<string, number>
  confidenceDistribution: Record<string, number>
  sourceDistribution: Record<string, number>
  recommendations: string[]
}> {
  try {
    const { data: videos, error } = await supabase
      .from("videos")
      .select("programming_language, ai_detection_result")
      .not("ai_detection_result", "is", null)

    if (error || !videos) {
      throw error
    }

    const languageDistribution: Record<string, number> = {}
    const confidenceDistribution: Record<string, number> = {}
    const sourceDistribution: Record<string, number> = {}
    const recommendations: string[] = []

    videos.forEach((video) => {
      // Language distribution
      const lang = video.programming_language || "None"
      languageDistribution[lang] = (languageDistribution[lang] || 0) + 1

      // Confidence distribution
      const confidence = video.ai_detection_result?.confidence || "unknown"
      confidenceDistribution[confidence] = (confidenceDistribution[confidence] || 0) + 1

      // Source distribution
      const source = video.ai_detection_result?.contextSources?.detectionSource || "unknown"
      sourceDistribution[source] = (sourceDistribution[source] || 0) + 1
    })

    // Generate AI-based recommendations
    const lowConfidenceCount = confidenceDistribution.low || 0
    const unknownCount = confidenceDistribution.unknown || 0
    const totalCount = videos.length

    if (lowConfidenceCount > totalCount * 0.3) {
      recommendations.push("Consider adding more detailed video summaries to improve detection accuracy")
    }

    if (unknownCount > totalCount * 0.1) {
      recommendations.push("Review videos with unknown confidence - may need manual language specification")
    }

    if (sourceDistribution.course_context > totalCount * 0.7) {
      recommendations.push("Most detections rely on course context - consider more specific video titles")
    }

    return {
      totalVideos: totalCount,
      languageDistribution,
      confidenceDistribution,
      sourceDistribution,
      recommendations,
    }
  } catch (error) {
    console.error("Error analyzing detection patterns:", error)
    return {
      totalVideos: 0,
      languageDistribution: {},
      confidenceDistribution: {},
      sourceDistribution: {},
      recommendations: ["Error analyzing patterns - please check system logs"],
    }
  }
}
