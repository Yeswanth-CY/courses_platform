import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Update last active timestamp
    const { error } = await supabase.from("users").update({ last_active: new Date().toISOString() }).eq("id", userId)

    if (error) {
      console.error("Error updating activity:", error)
      return NextResponse.json({ error: "Failed to update activity" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in update activity API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
