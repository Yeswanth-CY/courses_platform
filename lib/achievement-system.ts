export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  category: "learning" | "consistency" | "time" | "social" | "mastery" | "special"
  requirement: number
  xp_reward: number
  rarity: "common" | "rare" | "epic" | "legendary"
  condition: (userStats: any) => boolean
  progressTracker: (userStats: any) => number
}

export class AchievementSystem {
  static readonly ACHIEVEMENTS: Achievement[] = [
    // Learning Achievements
    {
      id: "first_steps",
      title: "First Steps",
      description: "Watch your first video",
      icon: "play",
      category: "learning",
      requirement: 1,
      xp_reward: 50,
      rarity: "common",
      condition: (stats) => stats.videos_watched >= 1,
      progressTracker: (stats) => stats.videos_watched,
    },
    {
      id: "video_explorer",
      title: "Video Explorer",
      description: "Watch 10 videos",
      icon: "compass",
      category: "learning",
      requirement: 10,
      xp_reward: 100,
      rarity: "common",
      condition: (stats) => stats.videos_watched >= 10,
      progressTracker: (stats) => stats.videos_watched,
    },
    {
      id: "binge_watcher",
      title: "Binge Watcher",
      description: "Watch 50 videos",
      icon: "tv",
      category: "learning",
      requirement: 50,
      xp_reward: 250,
      rarity: "rare",
      condition: (stats) => stats.videos_watched >= 50,
      progressTracker: (stats) => stats.videos_watched,
    },
    {
      id: "knowledge_seeker",
      title: "Knowledge Seeker",
      description: "Watch 100 videos",
      icon: "brain",
      category: "learning",
      requirement: 100,
      xp_reward: 500,
      rarity: "epic",
      condition: (stats) => stats.videos_watched >= 100,
      progressTracker: (stats) => stats.videos_watched,
    },
    {
      id: "master_learner",
      title: "Master Learner",
      description: "Watch 500 videos",
      icon: "crown",
      category: "learning",
      requirement: 500,
      xp_reward: 2000,
      rarity: "legendary",
      condition: (stats) => stats.videos_watched >= 500,
      progressTracker: (stats) => stats.videos_watched,
    },

    // Consistency Achievements
    {
      id: "streak_starter",
      title: "Streak Starter",
      description: "Learn for 3 days in a row",
      icon: "flame",
      category: "consistency",
      requirement: 3,
      xp_reward: 75,
      rarity: "common",
      condition: (stats) => stats.current_streak >= 3,
      progressTracker: (stats) => stats.current_streak,
    },
    {
      id: "week_warrior",
      title: "Week Warrior",
      description: "Learn for 7 days in a row",
      icon: "fire",
      category: "consistency",
      requirement: 7,
      xp_reward: 150,
      rarity: "rare",
      condition: (stats) => stats.current_streak >= 7,
      progressTracker: (stats) => stats.current_streak,
    },
    {
      id: "month_master",
      title: "Month Master",
      description: "Learn for 30 days in a row",
      icon: "volcano",
      category: "consistency",
      requirement: 30,
      xp_reward: 1000,
      rarity: "epic",
      condition: (stats) => stats.current_streak >= 30,
      progressTracker: (stats) => stats.current_streak,
    },
    {
      id: "century_champion",
      title: "Century Champion",
      description: "Learn for 100 days in a row",
      icon: "phoenix",
      category: "consistency",
      requirement: 100,
      xp_reward: 5000,
      rarity: "legendary",
      condition: (stats) => stats.current_streak >= 100,
      progressTracker: (stats) => stats.current_streak,
    },

    // Time Achievements
    {
      id: "time_invested",
      title: "Time Invested",
      description: "Study for 10 hours total",
      icon: "clock",
      category: "time",
      requirement: 36000, // 10 hours in seconds
      xp_reward: 200,
      rarity: "common",
      condition: (stats) => stats.time_spent >= 36000,
      progressTracker: (stats) => stats.time_spent,
    },
    {
      id: "marathon_learner",
      title: "Marathon Learner",
      description: "Study for 100 hours total",
      icon: "hourglass",
      category: "time",
      requirement: 360000, // 100 hours in seconds
      xp_reward: 1500,
      rarity: "epic",
      condition: (stats) => stats.time_spent >= 360000,
      progressTracker: (stats) => stats.time_spent,
    },
    {
      id: "time_master",
      title: "Time Master",
      description: "Study for 1000 hours total",
      icon: "robot",
      category: "time",
      requirement: 3600000, // 1000 hours in seconds
      xp_reward: 10000,
      rarity: "legendary",
      condition: (stats) => stats.time_spent >= 3600000,
      progressTracker: (stats) => stats.time_spent,
    },

    // Social Achievements
    {
      id: "heart_giver",
      title: "Heart Giver",
      description: "Like 50 videos",
      icon: "heart",
      category: "social",
      requirement: 50,
      xp_reward: 100,
      rarity: "common",
      condition: (stats) => stats.likes_given >= 50,
      progressTracker: (stats) => stats.likes_given || 0,
    },
    {
      id: "love_spreader",
      title: "Love Spreader",
      description: "Like 200 videos",
      icon: "butterfly",
      category: "social",
      requirement: 200,
      xp_reward: 300,
      rarity: "rare",
      condition: (stats) => stats.likes_given >= 200,
      progressTracker: (stats) => stats.likes_given || 0,
    },

    // XP Milestones
    {
      id: "xp_collector",
      title: "XP Collector",
      description: "Earn 1,000 XP",
      icon: "zap",
      category: "mastery",
      requirement: 1000,
      xp_reward: 100,
      rarity: "common",
      condition: (stats) => stats.total_xp >= 1000,
      progressTracker: (stats) => stats.total_xp,
    },
    {
      id: "xp_master",
      title: "XP Master",
      description: "Earn 10,000 XP",
      icon: "star",
      category: "mastery",
      requirement: 10000,
      xp_reward: 500,
      rarity: "rare",
      condition: (stats) => stats.total_xp >= 10000,
      progressTracker: (stats) => stats.total_xp,
    },
    {
      id: "xp_legend",
      title: "XP Legend",
      description: "Earn 100,000 XP",
      icon: "crown",
      category: "mastery",
      requirement: 100000,
      xp_reward: 2000,
      rarity: "epic",
      condition: (stats) => stats.total_xp >= 100000,
      progressTracker: (stats) => stats.total_xp,
    },
    {
      id: "xp_god",
      title: "XP God",
      description: "Earn 1,000,000 XP",
      icon: "diamond",
      category: "mastery",
      requirement: 1000000,
      xp_reward: 10000,
      rarity: "legendary",
      condition: (stats) => stats.total_xp >= 1000000,
      progressTracker: (stats) => stats.total_xp,
    },

    // Special Time-based Achievements
    {
      id: "early_bird",
      title: "Early Bird",
      description: "Study 10 times between 5-8 AM",
      icon: "sunrise",
      category: "special",
      requirement: 10,
      xp_reward: 200,
      rarity: "rare",
      condition: (stats) => stats.early_bird_sessions >= 10,
      progressTracker: (stats) => stats.early_bird_sessions || 0,
    },
    {
      id: "night_owl",
      title: "Night Owl",
      description: "Study 10 times between 10 PM-2 AM",
      icon: "moon",
      category: "special",
      requirement: 10,
      xp_reward: 200,
      rarity: "rare",
      condition: (stats) => stats.night_owl_sessions >= 10,
      progressTracker: (stats) => stats.night_owl_sessions || 0,
    },
    {
      id: "weekend_warrior",
      title: "Weekend Warrior",
      description: "Study 20 times on weekends",
      icon: "weekend",
      category: "special",
      requirement: 20,
      xp_reward: 300,
      rarity: "rare",
      condition: (stats) => stats.weekend_sessions >= 20,
      progressTracker: (stats) => stats.weekend_sessions || 0,
    },
  ]

  static checkAchievements(userStats: any): Achievement[] {
    return this.ACHIEVEMENTS.filter(
      (achievement) => achievement.condition(userStats) && !userStats.unlockedAchievements?.includes(achievement.id),
    )
  }

  static getAchievementProgress(userStats: any): Array<Achievement & { current_progress: number; unlocked: boolean }> {
    return this.ACHIEVEMENTS.map((achievement) => ({
      ...achievement,
      current_progress: Math.min(achievement.progressTracker(userStats), achievement.requirement),
      unlocked: achievement.condition(userStats),
    }))
  }
}
