import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export interface UserAction {
  userId: string
  action:
    | "video_like"
    | "video_watch"
    | "quiz_complete"
    | "challenge_complete"
    | "notes_read"
    | "course_complete"
    | "watch_bonus"
  videoId?: string
  quizId?: string
  challengeId?: string
  moduleId?: string
  courseId?: string
  timestamp: number
  metadata?: any
}

export interface ValidationResult {
  valid: boolean
  reason?: string
  cooldownRemaining?: number
}

export class AntiCheatValidator {
  // Updated cooldowns - removed video_watch restrictions for unlimited viewing
  private static readonly ACTION_COOLDOWNS = {
    video_like: 3000, // 3 seconds between likes
    video_watch: 0, // No cooldown - unlimited video watching
    quiz_complete: 120000, // 2 minutes between quiz completions
    challenge_complete: 300000, // 5 minutes between challenges
    notes_read: 10000, // 10 seconds between notes
    course_complete: 3600000, // 1 hour between course completions
    watch_bonus: 120000, // 2 minutes between watch bonuses
  }

  // Updated rate limits - removed video_watch limits
  private static readonly MAX_ACTIONS_PER_HOUR = {
    video_like: 30,
    video_watch: 0, // Unlimited video watching
    quiz_complete: 5,
    challenge_complete: 3,
    notes_read: 50,
    course_complete: 1,
    watch_bonus: 30,
  }

  // Updated daily limits - removed video_watch limits
  private static readonly MAX_ACTIONS_PER_DAY = {
    video_like: 100,
    video_watch: 0, // Unlimited video watching per day
    quiz_complete: 15,
    challenge_complete: 10,
    notes_read: 200,
    course_complete: 3,
    watch_bonus: 720,
  }

  private static readonly SUSPICIOUS_PATTERNS = {
    rapidClicking: 5,
    perfectTiming: 2,
    impossibleSpeed: 1000,
    linearProgression: 3,
  }

  static async validateAction(action: UserAction, recentActions: UserAction[]): Promise<ValidationResult> {
    // Special handling for video_watch - always allow (unlimited viewing)
    if (action.action === "video_watch") {
      return { valid: true }
    }

    // Check if this is a duplicate like (most important validation)
    if (action.action === "video_like") {
      const duplicateResult = await this.checkDuplicateLike(action)
      if (!duplicateResult.valid) return duplicateResult
    }

    // Check cooldown
    const cooldownResult = this.checkCooldown(action, recentActions)
    if (!cooldownResult.valid) return cooldownResult

    // Check rate limiting (skip for video_watch)
    if (action.action !== "video_watch") {
      const rateLimitResult = this.checkRateLimit(action, recentActions)
      if (!rateLimitResult.valid) return rateLimitResult

      // Check daily limits (skip for video_watch)
      const dailyLimitResult = await this.checkDailyLimit(action)
      if (!dailyLimitResult.valid) return dailyLimitResult
    }

    // Check for suspicious patterns (only for likes and other actions, not video_watch)
    if (action.action !== "video_watch") {
      const patternResult = this.checkSuspiciousPatterns(action, recentActions)
      if (!patternResult.valid) return patternResult
    }

    // Check action-specific validations
    const actionResult = await this.validateSpecificAction(action)
    if (!actionResult.valid) return actionResult

    return { valid: true }
  }

  private static async checkDuplicateLike(action: UserAction): Promise<ValidationResult> {
    if (!action.videoId) {
      return { valid: false, reason: "Invalid video ID" }
    }

    try {
      // Check if user has already liked this video
      const { data, error } = await supabase
        .from("user_likes")
        .select("id")
        .eq("user_id", action.userId)
        .eq("video_id", action.videoId)
        .limit(1)

      if (error) {
        console.error("Error checking duplicate like:", error)
        return { valid: true } // Allow on error to prevent blocking users
      }

      if (data && data.length > 0) {
        return {
          valid: false,
          reason: "You've already liked this video! ❤️",
        }
      }

      return { valid: true }
    } catch (error) {
      console.error("Error in checkDuplicateLike:", error)
      return { valid: true } // Allow on error
    }
  }

  private static checkCooldown(action: UserAction, recentActions: UserAction[]): ValidationResult {
    const cooldown = this.ACTION_COOLDOWNS[action.action]
    if (cooldown === 0) return { valid: true } // No cooldown

    const lastSimilarAction = recentActions
      .filter((a) => a.action === action.action && a.userId === action.userId)
      .sort((a, b) => b.timestamp - a.timestamp)[0]

    if (lastSimilarAction) {
      const timeSinceLastAction = action.timestamp - lastSimilarAction.timestamp
      if (timeSinceLastAction < cooldown) {
        const remainingSeconds = Math.ceil((cooldown - timeSinceLastAction) / 1000)
        return {
          valid: false,
          reason: `Please wait ${remainingSeconds} seconds before performing this action again`,
          cooldownRemaining: cooldown - timeSinceLastAction,
        }
      }
    }

    return { valid: true }
  }

  private static checkRateLimit(action: UserAction, recentActions: UserAction[]): ValidationResult {
    const maxActions = this.MAX_ACTIONS_PER_HOUR[action.action]
    if (maxActions === 0) return { valid: true } // No limit

    const oneHourAgo = action.timestamp - 60 * 60 * 1000
    const recentSimilarActions = recentActions.filter(
      (a) => a.action === action.action && a.userId === action.userId && a.timestamp > oneHourAgo,
    )

    if (recentSimilarActions.length >= maxActions) {
      return {
        valid: false,
        reason: `You've reached the hourly limit for this action (${maxActions} per hour)`,
      }
    }

    return { valid: true }
  }

  private static async checkDailyLimit(action: UserAction): Promise<ValidationResult> {
    const maxDaily = this.MAX_ACTIONS_PER_DAY[action.action]
    if (maxDaily === 0) return { valid: true } // No limit

    try {
      const today = new Date().toISOString().split("T")[0]

      // Use the correct table and column names
      const { data, error } = await supabase
        .from("user_daily_action_counts")
        .select("count")
        .eq("user_id", action.userId)
        .eq("action_type", action.action)
        .eq("action_date", today)
        .maybeSingle() // Use maybeSingle instead of single to handle no results

      if (error) {
        console.error("Error checking daily limit:", error)
        return { valid: true } // Allow on error to prevent blocking users
      }

      const count = data?.count || 0

      if (count >= maxDaily) {
        return {
          valid: false,
          reason: `You've reached the daily limit for this action (${maxDaily} per day)`,
        }
      }

      return { valid: true }
    } catch (error) {
      console.error("Error in checkDailyLimit:", error)
      return { valid: true } // Allow on error
    }
  }

  private static checkSuspiciousPatterns(action: UserAction, recentActions: UserAction[]): ValidationResult {
    const recentUserActions = recentActions
      .filter((a) => a.userId === action.userId && a.action === action.action)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)

    // Check for rapid clicking (only for likes)
    if (action.action === "video_like") {
      const last10Seconds = action.timestamp - 10000
      const rapidActions = recentUserActions.filter((a) => a.timestamp > last10Seconds)
      if (rapidActions.length > this.SUSPICIOUS_PATTERNS.rapidClicking) {
        return {
          valid: false,
          reason: "You're liking videos too quickly! Please slow down 😊",
        }
      }
    }

    // Check for impossible speed (only for likes)
    if (action.action === "video_like" && recentUserActions.length > 0) {
      const timeDiff = action.timestamp - recentUserActions[0].timestamp
      if (timeDiff < this.SUSPICIOUS_PATTERNS.impossibleSpeed) {
        return {
          valid: false,
          reason: "Please take a moment between likes 💙",
        }
      }
    }

    return { valid: true }
  }

  private static async validateSpecificAction(action: UserAction): Promise<ValidationResult> {
    switch (action.action) {
      case "video_like":
        return this.validateVideoLike(action)
      case "watch_bonus":
        return this.validateWatchBonus(action)
      case "quiz_complete":
        return this.validateQuizComplete(action)
      default:
        return { valid: true }
    }
  }

  private static async validateVideoLike(action: UserAction): Promise<ValidationResult> {
    if (!action.videoId) {
      return { valid: false, reason: "Invalid video like data" }
    }

    try {
      // For now, allow likes without strict watch time validation to prevent blocking
      // This can be re-enabled once the video progress tracking is fully implemented
      return { valid: true }
    } catch (error) {
      console.error("Error in validateVideoLike:", error)
      return { valid: true } // Allow on error
    }
  }

  private static async validateWatchBonus(action: UserAction): Promise<ValidationResult> {
    if (!action.videoId || !action.metadata?.watchTimeMinutes) {
      return { valid: false, reason: "Invalid watch bonus data" }
    }

    try {
      // Validate that the user has actually been watching for the claimed time
      const watchTimeMinutes = action.metadata.watchTimeMinutes
      if (watchTimeMinutes < 2) {
        return {
          valid: false,
          reason: "Watch for at least 2 minutes to earn bonus points",
        }
      }

      // Check if user already received bonus for this 2-minute interval
      const { data, error } = await supabase
        .from("user_watch_bonuses")
        .select("watch_time_minutes")
        .eq("user_id", action.userId)
        .eq("video_id", action.videoId)
        .order("watch_time_minutes", { ascending: false })
        .limit(1)

      if (error) {
        console.error("Error validating watch bonus:", error)
        return { valid: true } // Allow on error
      }

      if (data && data.length > 0) {
        const lastBonusTime = data[0].watch_time_minutes
        if (watchTimeMinutes - lastBonusTime < 2) {
          return {
            valid: false,
            reason: "You already received a bonus for this time period",
          }
        }
      }

      return { valid: true }
    } catch (error) {
      console.error("Error in validateWatchBonus:", error)
      return { valid: true } // Allow on error
    }
  }

  private static async validateQuizComplete(action: UserAction): Promise<ValidationResult> {
    if (!action.quizId || !action.metadata?.score || !action.metadata?.timeSpent) {
      return { valid: false, reason: "Invalid quiz completion data" }
    }

    // Check if time spent is reasonable (at least 10 seconds per question)
    const questionsCount = action.metadata.questionsCount || 5
    const minimumTimeRequired = questionsCount * 10

    if (action.metadata.timeSpent < minimumTimeRequired) {
      return {
        valid: false,
        reason: "You completed the quiz too quickly",
      }
    }

    return { valid: true }
  }
}
