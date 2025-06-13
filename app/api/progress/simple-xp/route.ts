import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { userId, xp, reason } = await request.json()

    if (!userId || !xp) {
      return NextResponse.json({ error: "Missing userId or xp" }, { status: 400 })
    }

    // Get current user data
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("total_xp, level")
      .eq("id", userId)
      .single()

    if (userError) {
      console.error("Error fetching user:", userError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const newTotalXP = (userData.total_xp || 0) + xp
    const newLevel = Math.floor(Math.sqrt(newTotalXP / 100)) + 1
    const levelUp = newLevel > (userData.level || 1)

    // Update user XP
    const { error: updateError } = await supabase
      .from("users")
      .update({
        total_xp: newTotalXP,
        level: newLevel,
        last_activity: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) {
      console.error("Error updating user XP:", updateError)
      return NextResponse.json({ error: "Failed to update XP" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      xpAwarded: xp,
      totalXP: newTotalXP,
      level: newLevel,
      levelUp: levelUp ? { oldLevel: userData.level || 1, newLevel } : null,
      reason: reason || "XP reward",
    })
  } catch (error) {
    console.error("Error in simple XP API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
