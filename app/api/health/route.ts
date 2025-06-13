import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase.from("courses").select("count").limit(1)

    if (connectionError) {
      // Check if it's a table doesn't exist error
      if (connectionError.message.includes("does not exist")) {
        return NextResponse.json({
          status: "tables_missing",
          message: "Database tables need to be created",
          error: connectionError.message,
        })
      }

      return NextResponse.json({
        status: "connection_error",
        message: "Database connection failed",
        error: connectionError.message,
      })
    }

    // Test if we can count courses
    const { count, error: countError } = await supabase.from("courses").select("*", { count: "exact", head: true })

    if (countError) {
      return NextResponse.json({
        status: "query_error",
        message: "Database query failed",
        error: countError.message,
      })
    }

    return NextResponse.json({
      status: "healthy",
      message: "Database is ready",
      courseCount: count || 0,
    })
  } catch (error) {
    return NextResponse.json({
      status: "error",
      message: "Unexpected error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
