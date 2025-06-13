import { ReelsFeed } from "@/components/reels-feed"
import { supabase } from "@/lib/supabase"

async function getModulesWithVideos() {
  try {
    const { data: modules, error } = await supabase
      .from("modules")
      .select(`
        *,
        videos(*),
        courses(*)
      `)
      .order("order_index", { ascending: true })

    if (error) {
      console.error("Error fetching modules:", error)
      return []
    }

    return modules || []
  } catch (error) {
    console.error("Error in getModulesWithVideos:", error)
    return []
  }
}

export default async function HomePage() {
  const modules = await getModulesWithVideos()

  return (
    <main className="min-h-screen bg-black">
      <ReelsFeed modules={modules} />
    </main>
  )
}
