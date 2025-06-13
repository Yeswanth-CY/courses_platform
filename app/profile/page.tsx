"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  User,
  Trophy,
  Zap,
  Flame,
  Target,
  Star,
  Crown,
  Calendar,
  TrendingUp,
  Award,
  BookOpen,
  Heart,
  Play,
} from "lucide-react"
import { useUser } from "@/contexts/user-context"
import { motion, AnimatePresence } from "framer-motion"
import { useRealTimeProgress } from "@/hooks/use-real-time-progress"
import { XPCalculator } from "@/lib/xp-system"

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

export default function ProfilePage() {
  const { user } = useUser()
  const { trackActivity } = useRealTimeProgress()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [levelUpAnimation, setLevelUpAnimation] = useState(false)

  useEffect(() => {
    if (user) {
      fetchAchievements()
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        fetchAchievements()
      }
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [user])

  const fetchAchievements = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/achievements/${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setAchievements(data)
      }
    } catch (error) {
      console.error("Error fetching achievements:", error)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <Card className="p-8 bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="text-center text-white">
            <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl">Please log in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate level and progress
  const totalXP = user.total_xp || 0
  const levelData = XPCalculator.calculateLevel(totalXP)
  const currentLevel = levelData.level
  const currentLevelProgress = levelData.currentLevelXP
  const progressPercentage = levelData.progress
  const nextLevelXP = levelData.nextLevelXP

  // Calculate stats
  const unlockedAchievements = achievements.filter((a) => a.unlocked).length
  const totalAchievements = achievements.length
  const completionRate = totalAchievements > 0 ? Math.round((unlockedAchievements / totalAchievements) * 100) : 0

  // Recent achievements (last 5 unlocked)
  const recentAchievements = achievements
    .filter((a) => a.unlocked)
    .sort((a, b) => (b.unlocked_at || "").localeCompare(a.unlocked_at || ""))
    .slice(0, 5)

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return "🔥🔥🔥"
    if (streak >= 14) return "🔥🔥"
    if (streak >= 7) return "🔥"
    if (streak >= 3) return "⚡"
    return "💫"
  }

  const getLevelBadge = (level: number) => {
    if (level >= 100) return { icon: Crown, color: "from-yellow-400 to-orange-500", title: "Legend" }
    if (level >= 50) return { icon: Trophy, color: "from-purple-400 to-pink-500", title: "Master" }
    if (level >= 25) return { icon: Star, color: "from-blue-400 to-cyan-500", title: "Expert" }
    if (level >= 10) return { icon: Award, color: "from-green-400 to-emerald-500", title: "Advanced" }
    return { icon: Target, color: "from-gray-400 to-gray-600", title: "Beginner" }
  }

  const levelBadge = getLevelBadge(currentLevel)
  const LevelIcon = levelBadge.icon

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center text-white">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full mx-auto mb-4"
          />
          <p className="text-xl">Loading your epic profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Level Up Animation */}
      <AnimatePresence>
        {levelUpAnimation && (
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
                <Crown className="w-16 h-16 mx-auto mb-4 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">Level Up!</h2>
              <p className="text-white">You've reached level {currentLevel}!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-6 py-8">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 overflow-hidden">
            <div className={`h-32 bg-gradient-to-r ${levelBadge.color}`} />
            <CardContent className="relative p-6">
              {/* Profile Avatar */}
              <div className="absolute -top-16 left-6">
                <div className={`w-24 h-24 rounded-full bg-gradient-to-r ${levelBadge.color} p-1`}>
                  <div className="w-full h-full rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center">
                    <User className="w-12 h-12 text-white" />
                  </div>
                </div>
              </div>

              <div className="ml-32">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                  <Badge className={`bg-gradient-to-r ${levelBadge.color} text-white border-none`}>
                    <LevelIcon className="w-4 h-4 mr-1" />
                    {levelBadge.title}
                  </Badge>
                </div>

                <div className="flex items-center gap-6 text-white/80 mb-4">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5" />
                    <span>Level {currentLevel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    <span>{totalXP.toLocaleString()} XP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5" />
                    <span>
                      {user.current_streak || 0} day streak {getStreakEmoji(user.current_streak || 0)}
                    </span>
                  </div>
                </div>

                {/* XP Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Level {currentLevel} Progress</span>
                    <span>{currentLevelProgress.toLocaleString()} / 1,000 XP</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full bg-gradient-to-r ${levelBadge.color} rounded-full`}
                    />
                  </div>
                  <p className="text-xs text-white/60">
                    {1000 - currentLevelProgress} XP until level {currentLevel + 1}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Overview */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-4 text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
                <div className="text-2xl font-bold text-white">{unlockedAchievements}</div>
                <div className="text-sm text-white/70">Achievements</div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-4 text-center">
                <BookOpen className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                <div className="text-2xl font-bold text-white">{user.videos_watched || 0}</div>
                <div className="text-sm text-white/70">Videos Watched</div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <div className="text-2xl font-bold text-white">{completionRate}%</div>
                <div className="text-sm text-white/70">Completion Rate</div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-4 text-center">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                <div className="text-2xl font-bold text-white">{user.best_streak || 0}</div>
                <div className="text-sm text-white/70">Best Streak</div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Tabs Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-white/10 backdrop-blur-lg border-white/20">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white/20">
                Overview
              </TabsTrigger>
              <TabsTrigger value="achievements" className="data-[state=active]:bg-white/20">
                Achievements
              </TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-white/20">
                Activity
              </TabsTrigger>
              <TabsTrigger value="stats" className="data-[state=active]:bg-white/20">
                Statistics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Recent Achievements */}
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Star className="w-5 h-5 text-yellow-400" />
                    Recent Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentAchievements.length > 0 ? (
                    <div className="space-y-3">
                      {recentAchievements.map((achievement) => (
                        <div
                          key={achievement.id}
                          className="flex items-center gap-4 p-3 bg-white/5 rounded-lg border border-white/10"
                        >
                          <div className="p-2 bg-yellow-500 rounded-full">
                            <Trophy className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-white">{achievement.title}</p>
                            <p className="text-sm text-white/70">{achievement.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-yellow-400">+{achievement.xp_reward} XP</p>
                            <p className="text-xs text-white/50 capitalize">{achievement.rarity}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Trophy className="w-12 h-12 mx-auto mb-4 text-white/30" />
                      <p className="text-white/70">No achievements unlocked yet</p>
                      <p className="text-sm text-white/50">Start learning to earn your first achievement!</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                      <Play className="w-4 h-4 mr-2" />
                      Watch Videos
                    </Button>
                    <Button className="bg-purple-500 hover:bg-purple-600 text-white">
                      <Trophy className="w-4 h-4 mr-2" />
                      View Achievements
                    </Button>
                    <Button className="bg-green-500 hover:bg-green-600 text-white">
                      <Target className="w-4 h-4 mr-2" />
                      Take Quiz
                    </Button>
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                      <Flame className="w-4 h-4 mr-2" />
                      Daily Challenge
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="achievements">
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Achievement Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.slice(0, 6).map((achievement) => (
                      <div
                        key={achievement.id}
                        className={`p-4 rounded-lg border ${
                          achievement.unlocked
                            ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30"
                            : "bg-white/5 border-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-full ${achievement.unlocked ? "bg-yellow-500" : "bg-gray-600"}`}>
                            {achievement.unlocked ? (
                              <Trophy className="w-4 h-4 text-white" />
                            ) : (
                              <Target className="w-4 h-4 text-gray-300" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-white">{achievement.title}</h4>
                            <p className="text-xs text-white/70 capitalize">{achievement.rarity}</p>
                          </div>
                        </div>
                        <p className="text-sm text-white/70 mb-3">{achievement.description}</p>
                        {!achievement.unlocked && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-white/60">
                              <span>Progress</span>
                              <span>
                                {achievement.current_progress}/{achievement.requirement}
                              </span>
                            </div>
                            <Progress
                              value={(achievement.current_progress / achievement.requirement) * 100}
                              className="h-2"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="text-center mt-6">
                    <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                      View All Achievements
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                      <div className="p-2 bg-blue-500 rounded-full">
                        <Play className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white">Watched a video</p>
                        <p className="text-sm text-white/70">Earned 50 XP</p>
                      </div>
                      <p className="text-xs text-white/50">2 hours ago</p>
                    </div>

                    <div className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                      <div className="p-2 bg-red-500 rounded-full">
                        <Heart className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white">Liked a video</p>
                        <p className="text-sm text-white/70">Earned 10 XP</p>
                      </div>
                      <p className="text-xs text-white/50">3 hours ago</p>
                    </div>

                    <div className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                      <div className="p-2 bg-yellow-500 rounded-full">
                        <Trophy className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white">Unlocked "First Steps" achievement</p>
                        <p className="text-sm text-white/70">Earned 50 bonus XP</p>
                      </div>
                      <p className="text-xs text-white/50">1 day ago</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Learning Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-white/70">Total XP</span>
                      <span className="text-white font-medium">{totalXP.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Current Level</span>
                      <span className="text-white font-medium">{currentLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Videos Watched</span>
                      <span className="text-white font-medium">{user.videos_watched || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Current Streak</span>
                      <span className="text-white font-medium">{user.current_streak || 0} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Best Streak</span>
                      <span className="text-white font-medium">{user.best_streak || 0} days</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Achievement Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-white/70">Unlocked</span>
                      <span className="text-white font-medium">{unlockedAchievements}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Total Available</span>
                      <span className="text-white font-medium">{totalAchievements}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Completion Rate</span>
                      <span className="text-white font-medium">{completionRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Bonus XP Earned</span>
                      <span className="text-white font-medium">
                        {achievements.filter((a) => a.unlocked).reduce((sum, a) => sum + a.xp_reward, 0)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}
