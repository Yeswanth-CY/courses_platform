import { NextResponse } from "next/server"
import { supabase, supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    // Check if users table exists
    const { error: checkError } = await supabase.from("users").select("count").limit(1).single()

    // If table doesn't exist, create it and add default users
    if (checkError && checkError.message.includes("does not exist")) {
      console.log("Users table doesn't exist. Creating it now...")

      // Create users table
      const { error: createError } = await supabaseAdmin.rpc("create_users_table")

      if (createError) {
        console.error("Error creating users table:", createError)
        return NextResponse.json(
          {
            error: "Users table doesn't exist. Please run the setup script first.",
            setupRequired: true,
          },
          { status: 404 },
        )
      }

      // Return default users after creation
      const { data: newUsers, error: fetchError } = await supabase.from("users").select("*").order("name")

      if (fetchError) {
        console.error("Error fetching users after creation:", fetchError)
        return NextResponse.json({ error: "Failed to fetch users after creation" }, { status: 500 })
      }

      return NextResponse.json(newUsers || [])
    }

    // Normal flow - fetch users
    const { data: users, error } = await supabase.from("users").select("*").order("name")

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    return NextResponse.json(users || [])
  } catch (error) {
    console.error("Error in users API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
