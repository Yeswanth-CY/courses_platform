import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  category: string
  requirement: number
  current_progress: number
  unlocked: boolean
  xp_reward: number
  rarity: "common" | "rare" | "epic" | "legendary"
  unlocked_at?: string
}

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const userId = params.userId

    // Get user data
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Try to get user actions (fallback if table doesn't exist)
    let actions: any[] = []
    let userStats: any = null

    try {
      // Check if user_actions table exists
      const { data: actionsData, error: actionsError } = await supabase
        .from("user_actions")
        .select("*")
        .eq("user_id", userId)

      if (!actionsError) {
        actions = actionsData || []
      }

      // Try to get cached stats
      const { data: statsData } = await supabase.from("user_stats").select("*").eq("user_id", userId).single()

      userStats = statsData
    } catch (error) {
      console.log("Anti-cheat tables not available, using fallback data")
    }

    // Calculate stats from available data
    const stats = calculateUserStats(user, actions, userStats)

    // Generate achievements based on stats
    const achievements = generateAchievements(stats)

    // Try to get existing achievement unlocks (fallback if table doesn't exist)
    let unlockedMap = new Map()
    try {
      const { data: unlockedAchievements } = await supabase
        .from("user_achievements")
        .select("achievement_id, unlocked_at")
        .eq("user_id", userId)

      if (unlockedAchievements) {
        unlockedMap = new Map(unlockedAchievements.map((ua) => [ua.achievement_id, ua.unlocked_at]))
      }
    } catch (error) {
      console.log("User achievements table not available, using progress-based unlocks")
    }

    // Mark achievements as unlocked
    const finalAchievements = achievements.map((achievement) => ({
      ...achievement,
      unlocked: unlockedMap.has(achievement.id) || achievement.current_progress >= achievement.requirement,
      unlocked_at: unlockedMap.get(achievement.id),
    }))

    // Try to store newly unlocked achievements if tables exist
    const newlyUnlocked = finalAchievements.filter((a) => a.current_progress >= a.requirement && !unlockedMap.has(a.id))

    if (newlyUnlocked.length > 0) {
      try {
        const unlockInserts = newlyUnlocked.map((achievement) => ({
          user_id: userId,
          achievement_id: achievement.id,
          unlocked_at: new Date().toISOString(),
        }))

        await supabase.from("user_achievements").insert(unlockInserts)

        // Award bonus XP
        const bonusXP = newlyUnlocked.reduce((sum, a) => sum + a.xp_reward, 0)
        if (bonusXP > 0) {
          await supabase
            .from("users")
            .update({ total_xp: (user.total_xp || 0) + bonusXP })
            .eq("id", userId)
        }
      } catch (error) {
        console.log("Could not store achievements, tables may not exist yet")
      }
    }

    return NextResponse.json(finalAchievements)
  } catch (error) {
    console.error("Error in achievements API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function calculateUserStats(user: any, actions: any[], cachedStats: any) {
  // If we have cached stats, use them
  if (cachedStats) {
    return {
      totalXP: user.total_xp || 0,
      videosWatched: cachedStats.videos_watched || 0,
      videosLiked: cachedStats.videos_liked || 0,
      currentStreak: user.current_streak || 0,
      bestStreak: user.best_streak || 0,
      timeSpent: cachedStats.total_watch_time || 0,
      totalActions: cachedStats.videos_watched + cachedStats.videos_liked || 0,
      averageSessionTime: cachedStats.total_watch_time / Math.max(cachedStats.videos_watched, 1) || 0,
    }
  }

  // Fallback: calculate from actions if available
  if (actions.length > 0) {
    const videoWatchActions = actions.filter((a) => a.action_type === "video_watch")
    const videoLikeActions = actions.filter((a) => a.action_type === "video_like")

    return {
      totalXP: user.total_xp || 0,
      videosWatched: videoWatchActions.length,
      videosLiked: videoLikeActions.length,
      currentStreak: user.current_streak || 0,
      bestStreak: user.best_streak || 0,
      timeSpent: videoWatchActions.reduce((sum, action) => sum + (action.metadata?.watchTime || 300), 0), // Default 5 min per video
      totalActions: actions.length,
      averageSessionTime:
        videoWatchActions.length > 0
          ? videoWatchActions.reduce((sum, a) => sum + (a.metadata?.watchTime || 300), 0) / videoWatchActions.length
          : 0,
    }
  }

  // Final fallback: use user data directly with estimated values
  const estimatedVideosWatched = Math.floor((user.total_xp || 0) / 50) // Assume 50 XP per video
  const estimatedTimeSpent = estimatedVideosWatched * 300 // 5 minutes per video

  return {
    totalXP: user.total_xp || 0,
    videosWatched: estimatedVideosWatched,
    videosLiked: Math.floor(estimatedVideosWatched * 0.7), // Assume 70% like rate
    currentStreak: user.current_streak || 0,
    bestStreak: user.best_streak || 0,
    timeSpent: estimatedTimeSpent,
    totalActions: estimatedVideosWatched * 2, // Watch + like actions
    averageSessionTime: 300, // 5 minutes average
  }
}

function generateAchievements(stats: any): Achievement[] {
  return [
    // Learning Achievements
    {
      id: "first-video",
      title: "First Steps",
      description: "Watch your first video",
      icon: "play",
      category: "learning",
      requirement: 1,
      current_progress: Math.min(stats.videosWatched, 1),
      unlocked: stats.videosWatched >= 1,
      xp_reward: 50,
      rarity: "common",
    },
    {
      id: "video-explorer",
      title: "Video Explorer",
      description: "Watch 5 different videos",
      icon: "compass",
      category: "learning",
      requirement: 5,
      current_progress: Math.min(stats.videosWatched, 5),
      unlocked: stats.videosWatched >= 5,
      xp_reward: 100,
      rarity: "common",
    },
    {
      id: "binge-watcher",
      title: "Binge Watcher",
      description: "Watch 25 videos",
      icon: "tv",
      category: "learning",
      requirement: 25,
      current_progress: Math.min(stats.videosWatched, 25),
      unlocked: stats.videosWatched >= 25,
      xp_reward: 500,
      rarity: "rare",
    },
    {
      id: "knowledge-seeker",
      title: "Knowledge Seeker",
      description: "Watch 100 videos",
      icon: "brain",
      category: "learning",
      requirement: 100,
      current_progress: Math.min(stats.videosWatched, 100),
      unlocked: stats.videosWatched >= 100,
      xp_reward: 2000,
      rarity: "epic",
    },

    // XP Achievements
    {
      id: "xp-novice",
      title: "XP Novice",
      description: "Earn 100 XP",
      icon: "zap",
      category: "progression",
      requirement: 100,
      current_progress: Math.min(stats.totalXP, 100),
      unlocked: stats.totalXP >= 100,
      xp_reward: 25,
      rarity: "common",
    },
    {
      id: "xp-adept",
      title: "XP Adept",
      description: "Earn 1,000 XP",
      icon: "star",
      category: "progression",
      requirement: 1000,
      current_progress: Math.min(stats.totalXP, 1000),
      unlocked: stats.totalXP >= 1000,
      xp_reward: 200,
      rarity: "rare",
    },
    {
      id: "xp-master",
      title: "XP Master",
      description: "Earn 10,000 XP",
      icon: "crown",
      category: "progression",
      requirement: 10000,
      current_progress: Math.min(stats.totalXP, 10000),
      unlocked: stats.totalXP >= 10000,
      xp_reward: 1000,
      rarity: "epic",
    },
    {
      id: "xp-legend",
      title: "XP Legend",
      description: "Earn 100,000 XP",
      icon: "diamond",
      category: "progression",
      requirement: 100000,
      current_progress: Math.min(stats.totalXP, 100000),
      unlocked: stats.totalXP >= 100000,
      xp_reward: 10000,
      rarity: "legendary",
    },

    // Streak Achievements
    {
      id: "streak-starter",
      title: "Streak Starter",
      description: "Maintain a 3-day streak",
      icon: "flame",
      category: "consistency",
      requirement: 3,
      current_progress: Math.min(stats.currentStreak, 3),
      unlocked: stats.currentStreak >= 3,
      xp_reward: 75,
      rarity: "common",
    },
    {
      id: "week-warrior",
      title: "Week Warrior",
      description: "Maintain a 7-day streak",
      icon: "fire",
      category: "consistency",
      requirement: 7,
      current_progress: Math.min(stats.currentStreak, 7),
      unlocked: stats.currentStreak >= 7,
      xp_reward: 200,
      rarity: "rare",
    },
    {
      id: "month-master",
      title: "Month Master",
      description: "Maintain a 30-day streak",
      icon: "volcano",
      category: "consistency",
      requirement: 30,
      current_progress: Math.min(stats.currentStreak, 30),
      unlocked: stats.currentStreak >= 30,
      xp_reward: 1500,
      rarity: "epic",
    },
    {
      id: "streak-legend",
      title: "Streak Legend",
      description: "Maintain a 100-day streak",
      icon: "phoenix",
      category: "consistency",
      requirement: 100,
      current_progress: Math.min(stats.currentStreak, 100),
      unlocked: stats.currentStreak >= 100,
      xp_reward: 10000,
      rarity: "legendary",
    },

    // Engagement Achievements
    {
      id: "first-like",
      title: "Show Some Love",
      description: "Like your first video",
      icon: "heart",
      category: "engagement",
      requirement: 1,
      current_progress: Math.min(stats.videosLiked, 1),
      unlocked: stats.videosLiked >= 1,
      xp_reward: 25,
      rarity: "common",
    },
    {
      id: "social-butterfly",
      title: "Social Butterfly",
      description: "Like 50 videos",
      icon: "butterfly",
      category: "engagement",
      requirement: 50,
      current_progress: Math.min(stats.videosLiked, 50),
      unlocked: stats.videosLiked >= 50,
      xp_reward: 300,
      rarity: "rare",
    },

    // Time-based Achievements (converted to minutes for display)
    {
      id: "quick-learner",
      title: "Quick Learner",
      description: "Spend 1 hour learning",
      icon: "clock",
      category: "dedication",
      requirement: 60, // 60 minutes
      current_progress: Math.min(Math.floor(stats.timeSpent / 60), 60),
      unlocked: stats.timeSpent >= 3600, // 1 hour in seconds
      xp_reward: 150,
      rarity: "common",
    },
    {
      id: "dedicated-student",
      title: "Dedicated Student",
      description: "Spend 10 hours learning",
      icon: "hourglass",
      category: "dedication",
      requirement: 600, // 600 minutes
      current_progress: Math.min(Math.floor(stats.timeSpent / 60), 600),
      unlocked: stats.timeSpent >= 36000, // 10 hours in seconds
      xp_reward: 1000,
      rarity: "rare",
    },
    {
      id: "learning-machine",
      title: "Learning Machine",
      description: "Spend 100 hours learning",
      icon: "robot",
      category: "dedication",
      requirement: 6000, // 6000 minutes
      current_progress: Math.min(Math.floor(stats.timeSpent / 60), 6000),
      unlocked: stats.timeSpent >= 360000, // 100 hours in seconds
      xp_reward: 5000,
      rarity: "epic",
    },
  ]
}
