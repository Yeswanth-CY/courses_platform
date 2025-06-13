import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params
    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get("videoId")
    const moduleId = searchParams.get("moduleId")

    let query = supabase.from("user_progress").select("*").eq("user_id", userId)

    if (videoId) {
      query = query.eq("video_id", videoId)
    }

    if (moduleId) {
      query = query.eq("module_id", moduleId)
    }

    const { data: progress, error } = await query.order("last_watched_at", { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json([])
    }

    // Get video details separately
    if (progress && progress.length > 0) {
      const videoIds = progress.map((p) => p.video_id).filter(Boolean)

      if (videoIds.length > 0) {
        const { data: videos } = await supabase
          .from("videos")
          .select("id, title, topic, video_url, module_id")
          .in("id", videoIds)

        const progressWithVideos = progress.map((p) => ({
          ...p,
          video: videos?.find((v) => v.id === p.video_id) || null,
        }))

        return NextResponse.json(progressWithVideos)
      }
    }

    return NextResponse.json(progress || [])
  } catch (error) {
    console.error("Error fetching user progress:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params
    const body = await request.json()
    const { videoId, xpEarned, quizScore, challengeCompleted, progressPercentage, timeSpent } = body

    if (!videoId) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 })
    }

    // Check if progress already exists
    const { data: existingProgress } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("video_id", videoId)
      .single()

    const progressData = {
      user_id: userId,
      video_id: videoId,
      xp_earned: xpEarned || existingProgress?.xp_earned || 0,
      quiz_score: quizScore !== undefined ? quizScore : existingProgress?.quiz_score,
      challenge_completed:
        challengeCompleted !== undefined ? challengeCompleted : existingProgress?.challenge_completed || false,
      progress_percentage:
        progressPercentage !== undefined ? progressPercentage : existingProgress?.progress_percentage || 0,
      time_spent: timeSpent !== undefined ? timeSpent : existingProgress?.time_spent || 0,
      last_watched_at: new Date().toISOString(),
    }

    let result
    if (existingProgress) {
      // Update existing progress
      const { data, error } = await supabase
        .from("user_progress")
        .update(progressData)
        .eq("id", existingProgress.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Insert new progress
      const { data, error } = await supabase.from("user_progress").insert(progressData).select().single()

      if (error) throw error
      result = data
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error updating progress:", error)
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 })
  }
}
