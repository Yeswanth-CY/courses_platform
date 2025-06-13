import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { XPCalculator } from "@/lib/xp-system"

export async function POST(request: NextRequest) {
  try {
    const { userId, videoId, watchTimeMinutes, metadata = {} } = await request.json()

    if (!userId || !videoId || !watchTimeMinutes) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get current user data
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (userError || !user) {
      console.error("Error fetching user:", userError)
      return NextResponse.json({ success: true }) // Return success anyway to not block the user
    }

    // Calculate current streak
    const currentStreak = user.current_streak || 0

    // Calculate XP with bonuses
    const xpResult = XPCalculator.calculateWatchBonus(watchTimeMinutes, {
      currentStreak,
      isWeekend: [0, 6].includes(new Date().getDay()),
    })

    // Update user XP
    const newTotalXP = (user.total_xp || 0) + xpResult.totalXP

    // Check for level up
    const oldLevel = XPCalculator.calculateLevel(user.total_xp || 0).level
    const newLevel = XPCalculator.calculateLevel(newTotalXP).level
    const leveledUp = newLevel > oldLevel

    // Try to update user stats
    try {
      await supabase
        .from("users")
        .update({
          total_xp: newTotalXP,
          last_active: new Date().toISOString(),
        })
        .eq("id", userId)
    } catch (updateError) {
      console.error("Error updating user XP:", updateError)
      // Continue anyway
    }

    // Try to record the watch bonus
    try {
      await supabase.from("user_watch_bonuses").insert({
        user_id: userId,
        video_id: videoId,
        watch_time_minutes: watchTimeMinutes,
        bonus_xp: xpResult.totalXP,
      })
    } catch (bonusError) {
      console.error("Error recording watch bonus:", bonusError)
      // Continue anyway
    }

    return NextResponse.json({
      success: true,
      xp: xpResult,
      levelUp: leveledUp ? { oldLevel, newLevel } : null,
      encouragement: xpResult.encouragement,
    })
  } catch (error) {
    console.error("Error in watch bonus API:", error)
    return NextResponse.json({ success: true }) // Return success anyway to not block the user
  }
}
