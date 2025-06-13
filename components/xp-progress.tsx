"use client"

import { Trophy, Star, Zap } from "lucide-react"

interface XPProgressProps {
  currentXP: number
  nextLevelXP: number
  level: number
  recentXP?: number
}

export function XPProgress({ currentXP, nextLevelXP, level, recentXP }: XPProgressProps) {
  const progress = (currentXP / nextLevelXP) * 100

  return (
    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-6 text-white mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6" />
          <span className="text-lg font-bold">Level {level}</span>
        </div>
        {recentXP && (
          <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-semibold">+{recentXP} XP</span>
          </div>
        )}
      </div>

      <div className="mb-2">
        <div className="flex justify-between text-sm mb-1">
          <span>{currentXP} XP</span>
          <span>{nextLevelXP} XP</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-3">
          <div
            className="bg-white rounded-full h-3 transition-all duration-500 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-1 text-sm">
        <Star className="w-4 h-4" />
        <span>{nextLevelXP - currentXP} XP to next level</span>
      </div>
    </div>
  )
}

// Add a simpler version for the header
export function XpProgress({ currentXp }: { currentXp: number }) {
  return (
    <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
      <Zap className="w-4 h-4 text-yellow-300" />
      <span className="text-sm font-semibold">{currentXp} XP</span>
    </div>
  )
}
