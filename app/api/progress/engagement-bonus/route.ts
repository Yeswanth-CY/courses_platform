import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { userId, videoId, watchTimeMinutes, engagementScore, metrics } = await request.json()

    if (!userId || !videoId || !watchTimeMinutes || !engagementScore) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createClient()

    // Calculate XP based on engagement score and watch time
    let xpAwarded = 0
    if (engagementScore >= 90) {
      xpAwarded = watchTimeMinutes * 15 // Excellent engagement
    } else if (engagementScore >= 70) {
      xpAwarded = watchTimeMinutes * 10 // Good engagement
    } else if (engagementScore >= 50) {
      xpAwarded = watchTimeMinutes * 5 // Fair engagement
    }

    if (xpAwarded > 0) {
      // Record the engagement bonus
      const { error: bonusError } = await supabase.from("user_engagement_bonuses").insert({
        user_id: userId,
        video_id: videoId,
        watch_time_minutes: watchTimeMinutes,
        engagement_score: engagementScore,
        xp_awarded: xpAwarded,
        metrics: metrics,
      })

      if (bonusError && !bonusError.message.includes("duplicate key")) {
        console.error("Error recording engagement bonus:", bonusError)
      }

      // Update user's total XP
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
      watchTimeMinutes,
    })
  } catch (error) {
    console.error("Error in engagement bonus API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
