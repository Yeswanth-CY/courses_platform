import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { userId, videoId, action, value, liked, bookmarked, watchTime, completed } = await request.json()

    if (!userId || !videoId) {
      return NextResponse.json({ error: "User ID and Video ID are required" }, { status: 400 })
    }

    // Handle different actions
    if (action === "like") {
      // Handle like action
      if (value) {
        // Add like
        const { error: likeError } = await supabase.from("user_likes").upsert({ user_id: userId, video_id: videoId })

        if (likeError) {
          console.error("Error adding like:", likeError)
          return NextResponse.json({ error: "Failed to add like" }, { status: 500 })
        }
      } else {
        // Remove like
        const { error: unlikeError } = await supabase
          .from("user_likes")
          .delete()
          .eq("user_id", userId)
          .eq("video_id", videoId)

        if (unlikeError) {
          console.error("Error removing like:", unlikeError)
          return NextResponse.json({ error: "Failed to remove like" }, { status: 500 })
        }
      }

      // Update video progress table
      const { data, error } = await supabase
        .from("user_video_progress")
        .upsert({
          user_id: userId,
          video_id: videoId,
          liked: value,
          last_watched: new Date().toISOString(),
        })
        .select()

      if (error) {
        console.error("Error updating video progress:", error)
        return NextResponse.json({ error: "Failed to update video progress" }, { status: 500 })
      }

      return NextResponse.json({ success: true, liked: value })
    }

    if (action === "bookmark") {
      // Handle bookmark action
      if (value) {
        // Add bookmark
        const { error: bookmarkError } = await supabase
          .from("user_bookmarks")
          .upsert({ user_id: userId, video_id: videoId })

        if (bookmarkError) {
          console.error("Error adding bookmark:", bookmarkError)
          return NextResponse.json({ error: "Failed to add bookmark" }, { status: 500 })
        }
      } else {
        // Remove bookmark
        const { error: unbookmarkError } = await supabase
          .from("user_bookmarks")
          .delete()
          .eq("user_id", userId)
          .eq("video_id", videoId)

        if (unbookmarkError) {
          console.error("Error removing bookmark:", unbookmarkError)
          return NextResponse.json({ error: "Failed to remove bookmark" }, { status: 500 })
        }
      }

      // Update video progress table
      const { data, error } = await supabase
        .from("user_video_progress")
        .upsert({
          user_id: userId,
          video_id: videoId,
          bookmarked: value,
          last_watched: new Date().toISOString(),
        })
        .select()

      if (error) {
        console.error("Error updating video progress:", error)
        return NextResponse.json({ error: "Failed to update video progress" }, { status: 500 })
      }

      return NextResponse.json({ success: true, bookmarked: value })
    }

    // Default progress update
    const { data, error } = await supabase
      .from("user_video_progress")
      .upsert({
        user_id: userId,
        video_id: videoId,
        liked: liked || false,
        bookmarked: bookmarked || false,
        watch_time: watchTime || 0,
        completed: completed || false,
        last_watched: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error updating video progress:", error)
      return NextResponse.json({ error: "Failed to update video progress" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in video progress API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get user's likes
    const { data: likesData, error: likesError } = await supabase
      .from("user_likes")
      .select("video_id")
      .eq("user_id", userId)

    if (likesError) {
      console.error("Error fetching likes:", likesError)
    }

    // Get user's bookmarks
    const { data: bookmarksData, error: bookmarksError } = await supabase
      .from("user_bookmarks")
      .select("video_id")
      .eq("user_id", userId)

    if (bookmarksError) {
      console.error("Error fetching bookmarks:", bookmarksError)
    }

    // Get video progress
    const { data: progressData, error: progressError } = await supabase
      .from("user_video_progress")
      .select("*")
      .eq("user_id", userId)

    if (progressError) {
      console.error("Error fetching video progress:", progressError)
    }

    // Format response
    const likes: Record<string, boolean> = {}
    const bookmarks: Record<string, boolean> = {}

    likesData?.forEach((like) => {
      likes[like.video_id] = true
    })

    bookmarksData?.forEach((bookmark) => {
      bookmarks[bookmark.video_id] = true
    })

    return NextResponse.json({
      likes,
      bookmarks,
      progress: progressData || [],
    })
  } catch (error) {
    console.error("Error in video progress API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
