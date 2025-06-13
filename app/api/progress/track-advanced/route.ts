import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { XPCalculator } from "@/lib/xp-system"
import { AchievementSystem } from "@/lib/achievement-system"

export async function POST(request: NextRequest) {
  try {
    const { userId, activityType, videoId, moduleId, courseId, metadata = {} } = await request.json()

    // Remove this problematic validation block:
    // const validationResult = await validateAction(request, action)
    // if (!validationResult.valid) {
    //   return validationResult.response
    // }

    // Replace with simple validation:
    if (!userId || !activityType) {
      return NextResponse.json({ error: "User ID and activity type are required" }, { status: 400 })
    }

    // Add basic cooldown check for likes
    if (activityType === "video_like") {
      const { data: recentLike } = await supabase
        .from("user_actions")
        .select("created_at")
        .eq("user_id", userId)
        .eq("activity_type", "video_like")
        .eq("video_id", videoId)
        .gte("created_at", new Date(Date.now() - 3000).toISOString()) // 3 second cooldown
        .limit(1)

      if (recentLike && recentLike.length > 0) {
        return NextResponse.json(
          {
            error: "Please wait before liking again",
            valid: false,
            reason: "Too many likes too quickly",
          },
          { status: 429 },
        )
      }
    }

    // Get current user data
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if this is a first-time activity
    const isFirstTime = await checkFirstTimeActivity(userId, activityType, videoId)

    // Calculate current streak
    const currentStreak = await calculateCurrentStreak(userId)

    // Get study session data for time-based bonuses
    const studyDuration = await getTodayStudyDuration(userId)

    // Prepare metadata for XP calculation
    const xpMetadata = {
      ...metadata,
      isFirstTime,
      currentStreak,
      studyDuration,
      isWeekend: [0, 6].includes(new Date().getDay()),
    }

    // Simplified XP calculation
    let xpToAward = 0
    const bonuses: string[] = []

    switch (activityType) {
      case "video_like":
        xpToAward = 15
        bonuses.push("Like bonus")
        break
      case "video_watch":
        xpToAward = 25
        bonuses.push("Watch bonus")
        break
      case "quiz_complete":
        xpToAward = 50
        bonuses.push("Quiz completion")
        break
      case "challenge_complete":
        xpToAward = 75
        bonuses.push("Challenge completion")
        break
      default:
        xpToAward = 10
    }

    // Add engagement bonus if provided
    if (metadata?.engagementScore && metadata.engagementScore > 70) {
      xpToAward += 10
      bonuses.push("High engagement")
    }

    // Add first-time bonus
    if (isFirstTime) {
      xpToAward += 25
      bonuses.push("First time")
    }

    const xpResult = {
      baseXP: xpToAward - (bonuses.length > 1 ? 35 : 0),
      totalXP: xpToAward,
      bonuses: bonuses,
    }

    // Check for level up
    const oldLevel = XPCalculator.calculateLevel(user.total_xp || 0).level
    const newTotalXP = (user.total_xp || 0) + xpResult.totalXP
    const newLevel = XPCalculator.calculateLevel(newTotalXP).level
    const leveledUp = newLevel > oldLevel

    // Update user stats
    const userUpdates: any = {
      total_xp: newTotalXP,
      last_active: new Date().toISOString(),
      current_streak: currentStreak,
    }

    // Update activity-specific counters
    switch (activityType) {
      case "video_watch":
        userUpdates.videos_watched = (user.videos_watched || 0) + 1
        break
      case "video_like":
        userUpdates.likes_given = (user.likes_given || 0) + 1
        break
      case "quiz_complete":
        userUpdates.quizzes_completed = (user.quizzes_completed || 0) + 1
        break
      case "challenge_complete":
        userUpdates.challenges_completed = (user.challenges_completed || 0) + 1
        break
    }

    // Update time-based session counters
    const currentHour = new Date().getHours()
    const isWeekend = [0, 6].includes(new Date().getDay())

    if (currentHour >= 5 && currentHour < 8) {
      userUpdates.early_bird_sessions = (user.early_bird_sessions || 0) + 1
    }
    if (currentHour >= 22 || currentHour < 2) {
      userUpdates.night_owl_sessions = (user.night_owl_sessions || 0) + 1
    }
    if (isWeekend) {
      userUpdates.weekend_sessions = (user.weekend_sessions || 0) + 1
    }

    // Update user in database
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update(userUpdates)
      .eq("id", userId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating user:", updateError)
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }

    // Check for new achievements
    const newAchievements = AchievementSystem.checkAchievements(updatedUser)

    // Award achievement XP and update user
    if (newAchievements.length > 0) {
      const achievementXP = newAchievements.reduce((sum, ach) => sum + ach.xp_reward, 0)
      const finalTotalXP = newTotalXP + achievementXP

      await supabase
        .from("users")
        .update({
          total_xp: finalTotalXP,
          unlocked_achievements: [...(user.unlocked_achievements || []), ...newAchievements.map((a) => a.id)],
        })
        .eq("id", userId)

      // Store achievement unlocks
      for (const achievement of newAchievements) {
        await supabase.from("user_achievements").insert({
          user_id: userId,
          achievement_id: achievement.id,
          unlocked_at: new Date().toISOString(),
          xp_awarded: achievement.xp_reward,
        })
      }
    }

    // Track the activity
    await supabase.from("user_activities").insert({
      user_id: userId,
      activity_type: activityType,
      video_id: videoId,
      module_id: moduleId,
      course_id: courseId,
      xp_earned: xpResult.totalXP,
      metadata: {
        ...metadata,
        bonuses: xpResult.bonuses,
        level_up: leveledUp,
        new_achievements: newAchievements.map((a) => a.id),
      },
    })

    // Update streak if needed
    await updateUserStreak(userId)

    return NextResponse.json({
      success: true,
      xp: xpResult,
      levelUp: leveledUp ? { oldLevel, newLevel } : null,
      newAchievements,
      currentStreak,
      user: updatedUser,
      notifications: {
        xpGained: xpResult,
        levelUp: leveledUp ? { oldLevel, newLevel } : null,
        achievements: newAchievements,
        streak: currentStreak >= 3 ? currentStreak : null,
      },
    })
  } catch (error) {
    console.error("Error in advanced progress tracking:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function checkFirstTimeActivity(userId: string, activityType: string, videoId?: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_activities")
    .select("id")
    .eq("user_id", userId)
    .eq("activity_type", activityType)
    .eq("video_id", videoId || null)
    .limit(1)

  return !data || data.length === 0
}

async function calculateCurrentStreak(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("user_daily_activity")
    .select("activity_date")
    .eq("user_id", userId)
    .order("activity_date", { ascending: false })
    .limit(100)

  if (error || !data) return 0

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < data.length; i++) {
    const activityDate = new Date(data[i].activity_date)
    activityDate.setHours(0, 0, 0, 0)

    const expectedDate = new Date(today)
    expectedDate.setDate(today.getDate() - i)

    if (activityDate.getTime() === expectedDate.getTime()) {
      streak++
    } else {
      break
    }
  }

  return streak
}

async function getTodayStudyDuration(userId: string): Promise<number> {
  const today = new Date().toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("user_activities")
    .select("metadata")
    .eq("user_id", userId)
    .gte("created_at", today + "T00:00:00")
    .lt("created_at", today + "T23:59:59")

  if (error || !data) return 0

  return data.reduce((total, activity) => {
    return total + (activity.metadata?.duration || 0)
  }, 0)
}

async function updateUserStreak(userId: string) {
  const today = new Date().toISOString().split("T")[0]

  // Insert or update today's activity record
  await supabase.from("user_daily_activity").upsert(
    {
      user_id: userId,
      activity_date: today,
      activities_count: 1,
    },
    {
      onConflict: "user_id,activity_date",
      ignoreDuplicates: false,
    },
  )
}
