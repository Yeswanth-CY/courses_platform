import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { user_id, video_id, xp_earned, quiz_score, challenge_completed } = await request.json()

    const { data: progress, error } = await supabase
      .from("user_progress")
      .upsert({
        user_id,
        video_id,
        xp_earned,
        quiz_score,
        challenge_completed,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(progress)
  } catch (error) {
    console.error("Error saving progress:", error)
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const { data: progress, error } = await supabase
      .from("user_progress")
      .select(`
        *,
        videos (
          title,
          course,
          topic
        )
      `)
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })

    if (error) throw error

    return NextResponse.json(progress)
  } catch (error) {
    console.error("Error fetching progress:", error)
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 })
  }
}
