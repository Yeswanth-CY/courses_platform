import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { AntiCheatValidator, type UserAction } from "@/lib/anti-cheat"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function validateAction(request: NextRequest, action: UserAction) {
  // Get client IP and user agent for security
  const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
  const userAgent = request.headers.get("user-agent") || "unknown"

  // Check for IP-based rate limiting
  const ipRateLimitResult = await checkIPRateLimit(clientIP)
  if (!ipRateLimitResult.valid) {
    return {
      valid: false,
      response: NextResponse.json(
        {
          error: ipRateLimitResult.reason,
          cooldownRemaining: ipRateLimitResult.cooldownRemaining,
        },
        { status: 429 },
      ),
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
    return {
      valid: false,
      response: NextResponse.json({ error: "Database error" }, { status: 500 }),
    }
  }

  // Convert to UserAction format
  const formattedActions: UserAction[] = recentActions.map((a) => ({
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
    // Log the failed validation attempt
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

    return {
      valid: false,
      response: NextResponse.json(
        {
          error: validation.reason,
          cooldownRemaining: validation.cooldownRemaining,
        },
        { status: 429 },
      ),
    }
  }

  return { valid: true }
}

// IP-based rate limiting to prevent multi-account abuse
async function checkIPRateLimit(ip: string): Promise<{ valid: boolean; reason?: string; cooldownRemaining?: number }> {
  // Implementation same as in the validate route
  // ...
}
