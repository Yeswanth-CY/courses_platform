import { toast } from "@/hooks/use-toast"

export interface NotificationData {
  type: "xp_gained" | "level_up" | "achievement_unlocked" | "streak_bonus" | "milestone_reached"
  title: string
  description: string
  xp?: number
  level?: number
  achievement?: string
  streak?: number
  icon?: string
  duration?: number
}

export class NotificationSystem {
  private static queue: NotificationData[] = []
  private static isProcessing = false

  static async showNotification(data: NotificationData) {
    this.queue.push(data)
    if (!this.isProcessing) {
      this.processQueue()
    }
  }

  private static async processQueue() {
    this.isProcessing = true

    while (this.queue.length > 0) {
      const notification = this.queue.shift()!
      await this.displayNotification(notification)
      await this.delay(1000) // 1 second between notifications
    }

    this.isProcessing = false
  }

  private static async displayNotification(data: NotificationData) {
    const { type, title, description, xp, level, achievement, streak, duration = 4000 } = data

    let emoji = "🎉"
    let className = "bg-gradient-to-r from-blue-500 to-purple-600"

    switch (type) {
      case "xp_gained":
        emoji = "⚡"
        className = "bg-gradient-to-r from-yellow-400 to-orange-500"
        break
      case "level_up":
        emoji = "🎊"
        className = "bg-gradient-to-r from-purple-500 to-pink-600"
        break
      case "achievement_unlocked":
        emoji = "🏆"
        className = "bg-gradient-to-r from-yellow-500 to-orange-600"
        break
      case "streak_bonus":
        emoji = "🔥"
        className = "bg-gradient-to-r from-red-500 to-orange-500"
        break
      case "milestone_reached":
        emoji = "🎯"
        className = "bg-gradient-to-r from-green-500 to-blue-500"
        break
    }

    toast({
      title: (
        <div className="flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          <span className="font-bold text-white">{title}</span>
        </div>
      ) as any,
      description: (
        <div className="text-white/90">
          <p>{description}</p>
          {xp && <p className="font-semibold mt-1">+{xp} XP</p>}
          {level && <p className="font-semibold mt-1">Level {level} Reached!</p>}
          {streak && <p className="font-semibold mt-1">{streak} Day Streak!</p>}
        </div>
      ) as any,
      className: `${className} border-none text-white shadow-lg`,
      duration,
    })

    // Play celebration sound effect (if available)
    this.playSound(type)
  }

  private static playSound(type: string) {
    try {
      // Create audio context for sound effects
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Different frequencies for different notification types
      const frequencies: Record<string, number[]> = {
        xp_gained: [523, 659], // C5, E5
        level_up: [523, 659, 784, 1047], // C5, E5, G5, C6
        achievement_unlocked: [392, 523, 659, 784], // G4, C5, E5, G5
        streak_bonus: [659, 784, 988], // E5, G5, B5
        milestone_reached: [523, 698, 880], // C5, F5, A5
      }

      const notes = frequencies[type] || [523, 659]

      notes.forEach((freq, index) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()

          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)

          oscillator.frequency.setValueAtTime(freq, audioContext.currentTime)
          oscillator.type = "sine"

          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.3)
        }, index * 100)
      })
    } catch (error) {
      // Silently fail if audio is not supported
      console.log("Audio not supported")
    }
  }

  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  static showXPGained(xp: number, bonuses: Array<{ type: string; amount: number; description: string }>) {
    let description = `You earned ${xp} XP!`
    if (bonuses.length > 0) {
      description += "\n" + bonuses.map((b) => `• ${b.description}`).join("\n")
    }

    this.showNotification({
      type: "xp_gained",
      title: "XP Gained!",
      description,
      xp,
    })
  }

  static showLevelUp(newLevel: number, oldLevel: number) {
    this.showNotification({
      type: "level_up",
      title: "Level Up!",
      description: `Congratulations! You've reached Level ${newLevel}!`,
      level: newLevel,
      duration: 6000,
    })
  }

  static showAchievementUnlocked(achievement: { title: string; description: string; xp_reward: number }) {
    this.showNotification({
      type: "achievement_unlocked",
      title: "Achievement Unlocked!",
      description: `${achievement.title}: ${achievement.description}`,
      xp: achievement.xp_reward,
      duration: 6000,
    })
  }

  static showStreakBonus(streak: number, bonusXP: number) {
    this.showNotification({
      type: "streak_bonus",
      title: "Streak Bonus!",
      description: `Amazing! You're on a ${streak}-day learning streak!`,
      streak,
      xp: bonusXP,
      duration: 5000,
    })
  }

  static showMilestone(milestone: string, description: string) {
    this.showNotification({
      type: "milestone_reached",
      title: milestone,
      description,
      duration: 5000,
    })
  }
}
