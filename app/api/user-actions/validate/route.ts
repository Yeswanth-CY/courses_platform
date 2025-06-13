import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { AntiCheatValidator, type UserAction } from "@/lib/anti-cheat"

export async function POST(request: NextRequest) {
  try {
    const action: UserAction = await request.json()

    if (!action.userId || !action.action || !action.timestamp) {
      return NextResponse.json({ error: "Invalid action data" }, { status: 400 })
    }

    // Get client IP and user agent for security
    const rawIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip")
    const clientIP = isValidIP(rawIP) ? rawIP : null
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Check for IP-based rate limiting (only if we have a valid IP)
    if (clientIP) {
      const ipRateLimitResult = await checkIPRateLimit(clientIP)
      if (!ipRateLimitResult.valid) {
        return NextResponse.json(
          {
            valid: false,
            reason: ipRateLimitResult.reason,
            cooldownRemaining: ipRateLimitResult.cooldownRemaining,
          },
          { status: 429 },
        )
      }
    }

    // Get recent actions for this user (last 2 hours)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    const { data: recentActions, error } = await supabase
      .from("user_actions")
      .select("*")
      .eq("user_id", action.userId)
      .gte("created_at", twoHoursAgo)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching recent actions:", error)
      // Continue with validation even if we can't fetch recent actions
    }

    // Convert to UserAction format
    const formattedActions: UserAction[] = (recentActions || []).map((a) => ({
      userId: a.user_id,
      action: a.action_type,
      videoId: a.video_id,
      quizId: a.quiz_id,
      challengeId: a.challenge_id,
      moduleId: a.module_id,
      courseId: a.course_id,
      timestamp: new Date(a.created_at).getTime(),
      metadata: a.metadata,
    }))

    // Validate the action
    const validation = await AntiCheatValidator.validateAction(action, formattedActions)

    if (!validation.valid) {
      // Try to log the failed validation attempt, but don't fail if it doesn't work
      try {
        await supabase.from("validation_failures").insert({
          user_id: action.userId,
          action_type: action.action,
          reason: validation.reason,
          ip_address: clientIP,
          user_agent: userAgent,
          metadata: {
            ...action.metadata,
            timestamp: action.timestamp,
          },
        })
      } catch (logError) {
        console.error("Error logging validation failure:", logError)
        // Continue anyway
      }

      return NextResponse.json(
        {
          valid: false,
          reason: validation.reason,
          cooldownRemaining: validation.cooldownRemaining,
        },
        { status: 429 },
      )
    }

    // If valid, try to store the action
    try {
      const { error: insertError } = await supabase.from("user_actions").insert({
        user_id: action.userId,
        action_type: action.action,
        video_id: action.videoId,
        quiz_id: action.quizId,
        challenge_id: action.challengeId,
        module_id: action.moduleId,
        course_id: action.courseId,
        metadata: action.metadata,
        ip_address: clientIP,
        user_agent: userAgent,
        created_at: new Date(action.timestamp).toISOString(),
      })

      if (insertError) {
        console.error("Error storing action:", insertError)
        // Continue anyway - don't block the user
      }
    } catch (storeError) {
      console.error("Error in storing action:", storeError)
      // Continue anyway
    }

    // For likes, also try to store in the dedicated likes table
    if (action.action === "video_like" && action.videoId) {
      try {
        await supabase.from("user_likes").insert({
          user_id: action.userId,
          video_id: action.videoId,
        })
      } catch (likeError) {
        console.error("Error storing like:", likeError)
        // Continue anyway
      }
    }

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error("Error in validate action API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper function to validate IP address format
function isValidIP(ip: string | null): boolean {
  if (!ip) return false

  // Check for localhost or development IPs
  if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost") return true

  // Simple IPv4 validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  if (ipv4Regex.test(ip)) {
    const parts = ip.split(".").map((part) => Number.parseInt(part, 10))
    return parts.every((part) => part >= 0 && part <= 255)
  }

  // Simple IPv6 validation (basic check)
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
  return ipv6Regex.test(ip)
}

// IP-based rate limiting to prevent multi-account abuse
async function checkIPRateLimit(ip: string): Promise<{ valid: boolean; reason?: string; cooldownRemaining?: number }> {
  // Skip for localhost or development
  if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost") {
    return { valid: true }
  }

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

  try {
    // Check recent actions from this IP
    const { data, error } = await supabase
      .from("user_actions")
      .select("created_at")
      .eq("ip_address", ip)
      .gte("created_at", fiveMinutesAgo)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error checking IP rate limit:", error)
      return { valid: true } // Allow on error
    }

    // IP-based rate limit: 100 actions per 5 minutes
    if (data && data.length >= 100) {
      return {
        valid: false,
        reason: "Too many actions from your network. Please try again later.",
        cooldownRemaining: 300000, // 5 minutes
      }
    }

    // Check for rapid succession (more than 20 actions in 10 seconds)
    const tenSecondsAgo = new Date(Date.now() - 10 * 1000).toISOString()
    const recentActions = data?.filter((a) => new Date(a.created_at) >= new Date(tenSecondsAgo))

    if (recentActions && recentActions.length >= 20) {
      return {
        valid: false,
        reason: "Actions too frequent. Please slow down.",
        cooldownRemaining: 30000, // 30 seconds
      }
    }

    return { valid: true }
  } catch (error) {
    console.error("Error in IP rate limit check:", error)
    return { valid: true } // Allow on error
  }
}
