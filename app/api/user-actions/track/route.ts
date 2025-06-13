import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

interface ActionRequest {
  userId: string
  action: string
  videoId?: string
  moduleId?: string
  courseId?: string
  points?: number
  metadata?: any
}

function isValidIP(ip: string): boolean {
  // Check for IPv4
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  // Check for IPv6
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/

  return ipv4Regex.test(ip) || ipv6Regex.test(ip)
}

function getClientIP(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")
  const remoteAddr = request.ip

  // Try different IP sources
  const possibleIPs = [forwarded?.split(",")[0]?.trim(), realIP, remoteAddr].filter(Boolean)

  // Return the first valid IP, or null if none found
  for (const ip of possibleIPs) {
    if (ip && isValidIP(ip)) {
      return ip
    }
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const body: ActionRequest = await request.json()
    const { userId, action, videoId, moduleId, courseId, points, metadata } = body

    if (!userId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Calculate XP based on action type
    let xpAwarded = points || 0
    if (xpAwarded === 0) {
      switch (action) {
        case "video_like":
          xpAwarded = 15
          break
        case "video_watch":
          xpAwarded = 50
          break
        case "video_complete":
          xpAwarded = 100
          break
        case "quiz_complete":
          xpAwarded = 150
          break
        case "challenge_complete":
          xpAwarded = 200
          break
        case "peer_tutor_question":
          xpAwarded = 15
          break
        case "course_complete":
          xpAwarded = 500
          break
        default:
          xpAwarded = 10
      }
    }

    // Get client IP and user agent for security
    const clientIP = getClientIP(request)
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Prepare action data
    const actionData: any = {
      user_id: userId,
      action_type: action,
      video_id: videoId || null,
      module_id: moduleId || null,
      course_id: courseId || null,
      xp_awarded: xpAwarded,
      metadata: metadata || {},
      user_agent: userAgent,
      created_at: new Date().toISOString(),
    }

    // Only add IP address if it's valid
    if (clientIP) {
      actionData.ip_address = clientIP
    }

    // Record the action
    const { data: recordedAction, error: actionError } = await supabase
      .from("user_actions")
      .insert(actionData)
      .select()
      .single()

    if (actionError) {
      console.error("Error recording action:", actionError)
      // Continue with user XP update even if action recording fails
    }

    // Update user's total XP
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("total_xp, level")
      .eq("id", userId)
      .single()

    if (userError) {
      console.error("Error fetching user data:", userError)
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
    }

    const newTotalXP = (userData.total_xp || 0) + xpAwarded
    const newLevel = calculateLevel(newTotalXP)
    const levelUp = newLevel > (userData.level || 1)

    // Update user's XP and level
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
      return NextResponse.json({ error: "Failed to update user XP" }, { status: 500 })
    }

    // Update peer tutor stats if applicable
    if (action === "peer_tutor_question") {
      try {
        await supabase.rpc("update_peer_tutor_stats", {
          p_user_id: userId,
          p_category: metadata?.category || null,
        })
      } catch (statsError) {
        console.error("Error updating peer tutor stats:", statsError)
        // Don't fail the request if stats update fails
      }
    }

    return NextResponse.json({
      success: true,
      xpAwarded,
      totalXP: newTotalXP,
      level: newLevel,
      levelUp: levelUp ? { oldLevel: userData.level || 1, newLevel } : null,
      actionRecorded: !actionError,
    })
  } catch (error) {
    console.error("Error in track action API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function calculateLevel(totalXP: number): number {
  // Level formula: Level = floor(sqrt(totalXP / 100)) + 1
  return Math.floor(Math.sqrt(totalXP / 100)) + 1
}
