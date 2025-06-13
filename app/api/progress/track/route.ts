import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { userId, videoId, moduleId, courseId, actionType, progressData } = await request.json()

    if (!userId || !videoId) {
      return NextResponse.json({ error: "User ID and Video ID are required" }, { status: 400 })
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 })
    }

    // Get or create user progress record
    const { data: existingProgress, error: fetchError } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("video_id", videoId)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error fetching progress:", fetchError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    // Calculate new progress based on action type
    const newProgressData = {
      user_id: userId,
      video_id: videoId,
      module_id: moduleId,
      course_id: courseId,
      progress_percentage: existingProgress?.progress_percentage || 0,
      time_spent: existingProgress?.time_spent || 0,
      xp_earned: existingProgress?.xp_earned || 0,
      quiz_score: existingProgress?.quiz_score,
      challenge_completed: existingProgress?.challenge_completed || false,
      completed: existingProgress?.completed || false,
      last_watched_at: new Date().toISOString(),
      ...progressData,
    }

    // Update progress based on action type
    switch (actionType) {
      case "video_started":
        newProgressData.progress_percentage = Math.max(newProgressData.progress_percentage, 5)
        break
      case "video_progress":
        newProgressData.progress_percentage = progressData.percentage || newProgressData.progress_percentage
        newProgressData.time_spent = progressData.timeSpent || newProgressData.time_spent
        break
      case "video_completed":
        newProgressData.progress_percentage = 100
        newProgressData.completed = true
        newProgressData.xp_earned += 20
        break
      case "section_completed":
        const sectionXP = progressData.xpGained || 10
        newProgressData.xp_earned += sectionXP
        newProgressData.progress_percentage = Math.min(100, newProgressData.progress_percentage + 10)
        break
      case "quiz_completed":
        newProgressData.quiz_score = progressData.score
        newProgressData.xp_earned += (progressData.score || 0) * 5
        newProgressData.progress_percentage = Math.min(100, newProgressData.progress_percentage + 15)
        break
      case "challenge_completed":
        newProgressData.challenge_completed = true
        newProgressData.xp_earned += 25
        newProgressData.progress_percentage = Math.min(100, newProgressData.progress_percentage + 20)
        break
    }

    // Upsert the progress record
    const { data: updatedProgress, error: upsertError } = await supabase
      .from("user_progress")
      .upsert(newProgressData, {
        onConflict: "user_id,video_id",
        ignoreDuplicates: false,
      })
      .select()
      .single()

    if (upsertError) {
      console.error("Error upserting progress:", upsertError)
      return NextResponse.json({ error: "Failed to update progress" }, { status: 500 })
    }

    // Update user's total XP
    const { error: userUpdateError } = await supabase
      .from("users")
      .update({
        total_xp: supabase.raw(`total_xp + ${newProgressData.xp_earned - (existingProgress?.xp_earned || 0)}`),
        last_active: new Date().toISOString(),
      })
      .eq("id", userId)

    if (userUpdateError) {
      console.error("Error updating user XP:", userUpdateError)
    }

    // Calculate module and course progress
    const moduleProgress = await calculateModuleProgress(userId, moduleId)
    const courseProgress = await calculateCourseProgress(userId, courseId)

    return NextResponse.json({
      progress: updatedProgress,
      moduleProgress,
      courseProgress,
      totalXpEarned: newProgressData.xp_earned,
    })
  } catch (error) {
    console.error("Error in progress tracking:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function calculateModuleProgress(userId: string, moduleId: string) {
  if (!moduleId) return null

  try {
    // Get all videos in the module
    const { data: moduleVideos, error: videosError } = await supabase
      .from("videos")
      .select("id")
      .eq("module_id", moduleId)

    if (videosError || !moduleVideos) return null

    // Get user progress for all videos in the module
    const { data: userProgress, error: progressError } = await supabase
      .from("user_progress")
      .select("progress_percentage, completed")
      .eq("user_id", userId)
      .in(
        "video_id",
        moduleVideos.map((v) => v.id),
      )

    if (progressError) return null

    const totalVideos = moduleVideos.length
    const completedVideos = userProgress?.filter((p) => p.completed).length || 0
    const avgProgress = userProgress?.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / totalVideos || 0

    return {
      totalVideos,
      completedVideos,
      progressPercentage: Math.round(avgProgress),
      completionRate: Math.round((completedVideos / totalVideos) * 100),
    }
  } catch (error) {
    console.error("Error calculating module progress:", error)
    return null
  }
}

async function calculateCourseProgress(userId: string, courseId: string) {
  if (!courseId) return null

  try {
    // Get all modules in the course
    const { data: courseModules, error: modulesError } = await supabase
      .from("modules")
      .select("id")
      .eq("course_id", courseId)

    if (modulesError || !courseModules) return null

    // Get all videos in all modules of the course
    const { data: courseVideos, error: videosError } = await supabase
      .from("videos")
      .select("id")
      .in(
        "module_id",
        courseModules.map((m) => m.id),
      )

    if (videosError || !courseVideos) return null

    // Get user progress for all videos in the course
    const { data: userProgress, error: progressError } = await supabase
      .from("user_progress")
      .select("progress_percentage, completed")
      .eq("user_id", userId)
      .in(
        "video_id",
        courseVideos.map((v) => v.id),
      )

    if (progressError) return null

    const totalVideos = courseVideos.length
    const completedVideos = userProgress?.filter((p) => p.completed).length || 0
    const avgProgress = userProgress?.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / totalVideos || 0

    return {
      totalVideos,
      completedVideos,
      progressPercentage: Math.round(avgProgress),
      completionRate: Math.round((completedVideos / totalVideos) * 100),
    }
  } catch (error) {
    console.error("Error calculating course progress:", error)
    return null
  }
}
