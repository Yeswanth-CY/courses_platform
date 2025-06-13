import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST() {
  try {
    // Call the stored procedure to create users table
    const { error } = await supabaseAdmin.rpc("create_users_table")

    if (error) {
      console.error("Error setting up database:", error)
      return NextResponse.json({ error: "Failed to set up database" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Database setup completed successfully" })
  } catch (error) {
    console.error("Error in setup database API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
