export interface XPActivity {
  type:
    | "video_watch"
    | "video_like"
    | "quiz_complete"
    | "challenge_complete"
    | "notes_read"
    | "course_complete"
    | "watch_bonus"
  basePoints: number
  bonusConditions?: {
    firstTime?: number
    perfectScore?: number
    timeBonus?: number
    streakMultiplier?: number
  }
}

export interface TimeBonus {
  name: string
  startHour: number
  endHour: number
  bonus: number
  emoji: string
}

export interface StreakBonus {
  days: number
  multiplier: number
  badge?: string
  bonusPoints?: number
}

export class XPCalculator {
  static readonly ACTIVITIES: Record<string, XPActivity> = {
    video_watch: { type: "video_watch", basePoints: 50, bonusConditions: { firstTime: 50, streakMultiplier: 1.5 } },
    video_like: { type: "video_like", basePoints: 15, bonusConditions: { streakMultiplier: 1.2 } },
    quiz_complete: {
      type: "quiz_complete",
      basePoints: 100,
      bonusConditions: { perfectScore: 100, streakMultiplier: 1.5 },
    },
    challenge_complete: {
      type: "challenge_complete",
      basePoints: 200,
      bonusConditions: { firstTime: 50, streakMultiplier: 1.5 },
    },
    notes_read: { type: "notes_read", basePoints: 15, bonusConditions: { streakMultiplier: 1.3 } },
    course_complete: { type: "course_complete", basePoints: 500, bonusConditions: { firstTime: 100 } },
    watch_bonus: { type: "watch_bonus", basePoints: 25, bonusConditions: { streakMultiplier: 1.3 } },
  }

  // Encouragement messages for different milestones
  static readonly ENCOURAGEMENT_MESSAGES = {
    2: { message: "Great start! Keep watching! 🌟", bonus: 5 },
    4: { message: "You're doing amazing! 🚀", bonus: 10 },
    6: { message: "Fantastic focus! 💪", bonus: 15 },
    8: { message: "You're on fire! 🔥", bonus: 20 },
    10: { message: "Incredible dedication! 🏆", bonus: 25 },
    15: { message: "Learning champion! 👑", bonus: 35 },
    20: { message: "Unstoppable learner! ⚡", bonus: 50 },
    30: { message: "Study marathon master! 🎯", bonus: 75 },
    45: { message: "Knowledge seeker extraordinaire! 🌟", bonus: 100 },
    60: { message: "Learning legend! You're incredible! 🎉", bonus: 150 },
  }

  static readonly TIME_BONUSES: TimeBonus[] = [
    { name: "Early Bird", startHour: 5, endHour: 8, bonus: 20, emoji: "🌅" },
    { name: "Night Owl", startHour: 22, endHour: 2, bonus: 15, emoji: "🦉" },
    { name: "Weekend Warrior", startHour: 0, endHour: 24, bonus: 25, emoji: "⚡" },
  ]

  static readonly STREAK_BONUSES: StreakBonus[] = [
    { days: 3, multiplier: 1.5, badge: "Streak Starter", bonusPoints: 75 },
    { days: 7, multiplier: 1.75, badge: "Week Warrior", bonusPoints: 150 },
    { days: 14, multiplier: 2.0, badge: "Fortnight Fighter", bonusPoints: 300 },
    { days: 30, multiplier: 2.5, badge: "Month Master", bonusPoints: 1000 },
    { days: 100, multiplier: 3.0, badge: "Century Champion", bonusPoints: 5000 },
  ]

  static calculateLevel(totalXP: number): {
    level: number
    currentLevelXP: number
    nextLevelXP: number
    progress: number
  } {
    // Dynamic leveling: Level n requires 100 * 1.4^(n-1) points
    let level = 1
    let totalRequired = 0
    let currentLevelRequirement = 100

    while (totalRequired + currentLevelRequirement <= totalXP) {
      totalRequired += currentLevelRequirement
      level++
      currentLevelRequirement = Math.floor(100 * Math.pow(1.4, level - 1))
    }

    const currentLevelXP = totalXP - totalRequired
    const nextLevelXP = currentLevelRequirement
    const progress = (currentLevelXP / nextLevelXP) * 100

    return { level, currentLevelXP, nextLevelXP, progress }
  }

  static calculateWatchBonus(
    watchTimeMinutes: number,
    metadata: {
      currentStreak?: number
      isWeekend?: boolean
    } = {},
  ): {
    baseXP: number
    bonusXP: number
    totalXP: number
    bonuses: Array<{ type: string; amount: number; description: string }>
    encouragement?: { message: string; bonus: number }
  } {
    const activity = this.ACTIVITIES.watch_bonus
    const baseXP = activity.basePoints
    let bonusXP = 0
    const bonuses: Array<{ type: string; amount: number; description: string }> = []
    let encouragement: { message: string; bonus: number } | undefined

    // Get encouragement message for current watch time
    const encouragementKeys = Object.keys(this.ENCOURAGEMENT_MESSAGES)
      .map(Number)
      .sort((a, b) => b - a) // Sort descending

    for (const minutes of encouragementKeys) {
      if (watchTimeMinutes >= minutes) {
        encouragement = this.ENCOURAGEMENT_MESSAGES[minutes as keyof typeof this.ENCOURAGEMENT_MESSAGES]
        bonusXP += encouragement.bonus
        bonuses.push({
          type: "encouragement",
          amount: encouragement.bonus,
          description: encouragement.message,
        })
        break
      }
    }

    // Time-based bonuses
    const currentHour = new Date().getHours()
    const isWeekend = metadata.isWeekend || [0, 6].includes(new Date().getDay())

    for (const timeBonus of this.TIME_BONUSES) {
      if (timeBonus.name === "Weekend Warrior" && isWeekend) {
        bonusXP += timeBonus.bonus
        bonuses.push({
          type: "time_bonus",
          amount: timeBonus.bonus,
          description: `${timeBonus.emoji} ${timeBonus.name} bonus!`,
        })
      } else if (timeBonus.name !== "Weekend Warrior") {
        const isInTimeRange =
          timeBonus.startHour <= timeBonus.endHour
            ? currentHour >= timeBonus.startHour && currentHour < timeBonus.endHour
            : currentHour >= timeBonus.startHour || currentHour < timeBonus.endHour

        if (isInTimeRange) {
          bonusXP += timeBonus.bonus
          bonuses.push({
            type: "time_bonus",
            amount: timeBonus.bonus,
            description: `${timeBonus.emoji} ${timeBonus.name} bonus!`,
          })
        }
      }
    }

    // Streak multiplier
    if (metadata.currentStreak && metadata.currentStreak >= 3) {
      const streakBonus = this.STREAK_BONUSES.filter((sb) => metadata.currentStreak! >= sb.days).sort(
        (a, b) => b.days - a.days,
      )[0]

      if (streakBonus && activity.bonusConditions?.streakMultiplier) {
        const multiplierBonus = Math.floor((baseXP + bonusXP) * (streakBonus.multiplier - 1))
        bonusXP += multiplierBonus
        bonuses.push({
          type: "streak",
          amount: multiplierBonus,
          description: `🔥 ${metadata.currentStreak}-day streak multiplier!`,
        })
      }
    }

    const totalXP = baseXP + bonusXP

    return { baseXP, bonusXP, totalXP, bonuses, encouragement }
  }

  static calculateXP(
    activityType: string,
    metadata: {
      isFirstTime?: boolean
      score?: number
      completionRate?: number
      currentStreak?: number
      studyDuration?: number
      isWeekend?: boolean
    } = {},
  ): {
    baseXP: number
    bonusXP: number
    totalXP: number
    bonuses: Array<{ type: string; amount: number; description: string }>
  } {
    const activity = this.ACTIVITIES[activityType]
    if (!activity) {
      return { baseXP: 0, bonusXP: 0, totalXP: 0, bonuses: [] }
    }

    const baseXP = activity.basePoints
    let bonusXP = 0
    const bonuses: Array<{ type: string; amount: number; description: string }> = []

    // First time bonus
    if (metadata.isFirstTime && activity.bonusConditions?.firstTime) {
      const bonus = activity.bonusConditions.firstTime
      bonusXP += bonus
      bonuses.push({ type: "first_time", amount: bonus, description: "First time bonus! 🎉" })
    }

    // Perfect score bonus
    if (metadata.score === 100 && activity.bonusConditions?.perfectScore) {
      const bonus = activity.bonusConditions.perfectScore
      bonusXP += bonus
      bonuses.push({ type: "perfect_score", amount: bonus, description: "Perfect score bonus! 💯" })
    }

    // Completion rate bonus
    if (metadata.completionRate && metadata.completionRate >= 95) {
      const bonus = 30
      bonusXP += bonus
      bonuses.push({ type: "completion", amount: bonus, description: "95%+ completion bonus! ⭐" })
    } else if (metadata.completionRate && metadata.completionRate >= 80) {
      const bonus = 15
      bonusXP += bonus
      bonuses.push({ type: "completion", amount: bonus, description: "80%+ completion bonus! 👍" })
    }

    // Time-based bonuses
    const currentHour = new Date().getHours()
    const isWeekend = metadata.isWeekend || [0, 6].includes(new Date().getDay())

    for (const timeBonus of this.TIME_BONUSES) {
      if (timeBonus.name === "Weekend Warrior" && isWeekend) {
        bonusXP += timeBonus.bonus
        bonuses.push({
          type: "time_bonus",
          amount: timeBonus.bonus,
          description: `${timeBonus.emoji} ${timeBonus.name} bonus!`,
        })
      } else if (timeBonus.name !== "Weekend Warrior") {
        const isInTimeRange =
          timeBonus.startHour <= timeBonus.endHour
            ? currentHour >= timeBonus.startHour && currentHour < timeBonus.endHour
            : currentHour >= timeBonus.startHour || currentHour < timeBonus.endHour

        if (isInTimeRange) {
          bonusXP += timeBonus.bonus
          bonuses.push({
            type: "time_bonus",
            amount: timeBonus.bonus,
            description: `${timeBonus.emoji} ${timeBonus.name} bonus!`,
          })
        }
      }
    }

    // Study duration bonus
    if (metadata.studyDuration && metadata.studyDuration >= 7200) {
      // 2+ hours
      const bonus = 100
      bonusXP += bonus
      bonuses.push({ type: "duration", amount: bonus, description: "🎯 Marathon study bonus!" })
    }

    // Streak multiplier
    if (metadata.currentStreak && metadata.currentStreak >= 3) {
      const streakBonus = this.STREAK_BONUSES.filter((sb) => metadata.currentStreak! >= sb.days).sort(
        (a, b) => b.days - a.days,
      )[0]

      if (streakBonus && activity.bonusConditions?.streakMultiplier) {
        const multiplierBonus = Math.floor((baseXP + bonusXP) * (streakBonus.multiplier - 1))
        bonusXP += multiplierBonus
        bonuses.push({
          type: "streak",
          amount: multiplierBonus,
          description: `🔥 ${metadata.currentStreak}-day streak multiplier!`,
        })
      }
    }

    const totalXP = baseXP + bonusXP

    return { baseXP, bonusXP, totalXP, bonuses }
  }

  static getStreakBonus(streak: number): StreakBonus | null {
    return this.STREAK_BONUSES.filter((sb) => streak >= sb.days).sort((a, b) => b.days - a.days)[0] || null
  }

  static shouldShowLevelUp(oldXP: number, newXP: number): boolean {
    const oldLevel = this.calculateLevel(oldXP).level
    const newLevel = this.calculateLevel(newXP).level
    return newLevel > oldLevel
  }
}
