import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { userId, videoId, metrics } = await request.json()

    if (!userId || !videoId || !metrics) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createClient()

    // Calculate completion XP based on engagement
    let xpAwarded = 0
    const engagementScore = metrics.engagementScore || 0
    const completionPercentage = metrics.videoProgress || 0

    if (completionPercentage >= 90) {
      if (engagementScore >= 80) {
        xpAwarded = 100 // Perfect completion with high engagement
      } else if (engagementScore >= 60) {
        xpAwarded = 75 // Good completion
      } else {
        xpAwarded = 50 // Basic completion
      }
    } else if (completionPercentage >= 70) {
      xpAwarded = Math.round(xpAwarded * 0.7) // Partial completion
    }

    // Record the video completion
    const { error: completionError } = await supabase.from("user_video_completions").insert({
      user_id: userId,
      video_id: videoId,
      completion_percentage: completionPercentage,
      engagement_score: engagementScore,
      actual_watch_time: metrics.actualWatchTime || 0,
      total_time_spent: metrics.totalTimeSpent || 0,
      tab_switches: metrics.tabSwitches || 0,
      xp_awarded: xpAwarded,
      metrics: metrics,
    })

    if (completionError && !completionError.message.includes("duplicate key")) {
      console.error("Error recording video completion:", completionError)
    }

    // Update user's total XP
    if (xpAwarded > 0) {
      const { error: xpError } = await supabase
        .from("users")
        .update({
          xp: supabase.raw(`COALESCE(xp, 0) + ${xpAwarded}`),
        })
        .eq("id", userId)

      if (xpError) {
        console.error("Error updating user XP:", xpError)
      }
    }

    return NextResponse.json({
      success: true,
      xpAwarded,
      engagementScore: Math.round(engagementScore),
      completionPercentage: Math.round(completionPercentage),
    })
  } catch (error) {
    console.error("Error in video completion API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
