"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Trophy,
  Lock,
  Star,
  Zap,
  Flame,
  BookOpen,
  Heart,
  Clock,
  Target,
  Crown,
  Diamond,
  Sparkles,
  PartyPopper,
} from "lucide-react"
import { useUser } from "@/contexts/user-context"
import { motion, AnimatePresence } from "framer-motion"
import { useRealTimeProgress } from "@/hooks/use-real-time-progress"
import { AchievementSystem } from "@/lib/achievement-system"

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

export default function AchievementsPage() {
  const { user } = useUser()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([])
  const [showCelebration, setShowCelebration] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const { trackActivity } = useRealTimeProgress()

  useEffect(() => {
    if (user) {
      fetchAchievements()
    }
  }, [user])

  // Add this useEffect for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        fetchAchievements()
      }
    }, 3000) // Refresh every 3 seconds

    return () => clearInterval(interval)
  }, [user])

  const fetchAchievements = async () => {
    if (!user) return

    try {
      // Use the new achievement system
      const achievementProgress = AchievementSystem.getAchievementProgress(user)
      setAchievements(achievementProgress)
    } catch (error) {
      console.error("Error fetching achievements:", error)
    } finally {
      setLoading(false)
    }
  }

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      play: BookOpen,
      compass: Target,
      tv: BookOpen,
      brain: Star,
      zap: Zap,
      star: Star,
      crown: Crown,
      diamond: Diamond,
      flame: Flame,
      fire: Flame,
      volcano: Flame,
      phoenix: Flame,
      heart: Heart,
      butterfly: Heart,
      clock: Clock,
      hourglass: Clock,
      robot: Clock,
      trophy: Trophy,
    }
    return icons[iconName] || Trophy
  }

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: "from-gray-400 to-gray-600",
      rare: "from-blue-400 to-blue-600",
      epic: "from-purple-400 to-purple-600",
      legendary: "from-yellow-400 to-orange-500",
    }
    return colors[rarity as keyof typeof colors] || colors.common
  }

  const getRarityBorder = (rarity: string) => {
    const borders = {
      common: "border-gray-300",
      rare: "border-blue-300 shadow-blue-100",
      epic: "border-purple-300 shadow-purple-100",
      legendary: "border-yellow-300 shadow-yellow-100",
    }
    return borders[rarity as keyof typeof borders] || borders.common
  }

  const categories = ["all", ...new Set(achievements.map((a) => a.category))]
  const filteredAchievements =
    selectedCategory === "all" ? achievements : achievements.filter((a) => a.category === selectedCategory)

  const unlockedCount = achievements.filter((a) => a.unlocked).length
  const totalXPFromAchievements = achievements.filter((a) => a.unlocked).reduce((sum, a) => sum + a.xp_reward, 0)

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <Card className="p-8 bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="text-center text-white">
            <Lock className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl">Please log in to view your achievements.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center text-white">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full mx-auto mb-4"
          />
          <p className="text-xl">Loading your epic achievements...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Celebration Animation */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 p-8 rounded-2xl text-center max-w-md mx-4"
            >
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5, repeat: 3 }}>
                <PartyPopper className="w-16 h-16 mx-auto mb-4 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">Achievement Unlocked!</h2>
              {newlyUnlocked.map((achievement) => (
                <div key={achievement.id} className="mb-2">
                  <p className="text-white font-semibold">{achievement.title}</p>
                  <p className="text-white/80 text-sm">{achievement.description}</p>
                  <p className="text-white font-bold">+{achievement.xp_reward} XP</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            🏆 Hall of Achievements
          </h1>
          <p className="text-xl text-white/80 mb-8">Unlock epic rewards and showcase your learning mastery</p>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20"
            >
              <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
              <div className="text-2xl font-bold">{unlockedCount}</div>
              <div className="text-sm text-white/70">Unlocked</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20"
            >
              <Target className="w-8 h-8 mx-auto mb-2 text-blue-400" />
              <div className="text-2xl font-bold">{achievements.length}</div>
              <div className="text-sm text-white/70">Total</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20"
            >
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-purple-400" />
              <div className="text-2xl font-bold">{Math.round((unlockedCount / achievements.length) * 100)}%</div>
              <div className="text-sm text-white/70">Complete</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20"
            >
              <Zap className="w-8 h-8 mx-auto mb-2 text-green-400" />
              <div className="text-2xl font-bold">{totalXPFromAchievements}</div>
              <div className="text-sm text-white/70">Bonus XP</div>
            </motion.div>
          </div>

          {/* Progress Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-between text-sm mb-2">
              <span>Overall Progress</span>
              <span>
                {unlockedCount}/{achievements.length}
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
              />
            </div>
          </div>
        </motion.div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className={`capitalize ${
                selectedCategory === category
                  ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                  : "bg-white/10 text-white border-white/30 hover:bg-white/20"
              }`}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map((achievement, index) => {
            const IconComponent = getIconComponent(achievement.icon)
            const progress = Math.min((achievement.current_progress / achievement.requirement) * 100, 100)

            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className={`relative overflow-hidden rounded-xl border-2 ${getRarityBorder(achievement.rarity)} ${
                  achievement.unlocked ? "bg-gradient-to-br from-white/20 to-white/10 shadow-lg" : "bg-white/5"
                } backdrop-blur-lg`}
              >
                {/* Rarity Glow Effect */}
                {achievement.unlocked && (
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${getRarityColor(achievement.rarity)} opacity-10`}
                  />
                )}

                <CardContent className="p-6 relative z-10">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`relative p-4 rounded-full ${
                        achievement.unlocked ? `bg-gradient-to-r ${getRarityColor(achievement.rarity)}` : "bg-gray-600"
                      }`}
                    >
                      {achievement.unlocked ? (
                        <IconComponent className="w-8 h-8 text-white" />
                      ) : (
                        <Lock className="w-8 h-8 text-gray-300" />
                      )}

                      {/* Sparkle Effect for Unlocked */}
                      {achievement.unlocked && (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                          className="absolute -top-1 -right-1"
                        >
                          <Sparkles className="w-4 h-4 text-yellow-300" />
                        </motion.div>
                      )}
                    </div>

                    <div className="flex-1">
                      {/* Title and Rarity */}
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className={`font-bold ${achievement.unlocked ? "text-white" : "text-gray-300"}`}>
                          {achievement.title}
                        </h3>
                        {achievement.unlocked && <Trophy className="w-4 h-4 text-yellow-400" />}
                      </div>

                      <p className="text-sm text-white/70 mb-3">{achievement.description}</p>

                      {/* Progress */}
                      {!achievement.unlocked && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-white/60">
                            <span>Progress</span>
                            <span>
                              {achievement.current_progress}/{achievement.requirement}
                            </span>
                          </div>
                          <div className="w-full bg-white/20 rounded-full h-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className={`h-full rounded-full bg-gradient-to-r ${getRarityColor(achievement.rarity)}`}
                            />
                          </div>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-4">
                        <Badge
                          variant="outline"
                          className={`text-xs border-none text-white bg-gradient-to-r ${getRarityColor(achievement.rarity)}`}
                        >
                          {achievement.rarity}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-white/60">
                          <Zap className="w-3 h-3" />
                          <span>{achievement.xp_reward} XP</span>
                        </div>
                      </div>

                      {/* Unlock Date */}
                      {achievement.unlocked && achievement.unlocked_at && (
                        <div className="text-xs text-white/50 mt-2">
                          Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredAchievements.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <Trophy className="w-24 h-24 mx-auto mb-4 text-white/30" />
            <h3 className="text-2xl font-bold text-white/70 mb-2">No achievements in this category yet</h3>
            <p className="text-white/50">Keep learning to unlock amazing rewards!</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
