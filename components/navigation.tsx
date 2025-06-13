"use client"

import { Home, BookOpen, User, Trophy, Plus, GraduationCap, LogOut, Bot } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useUser } from "@/contexts/user-context"
import { Button } from "@/components/ui/button"

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, setUser } = useUser()

  const navItems = [
    { href: "/", icon: Home, label: "Reels" },
    { href: "/courses", icon: GraduationCap, label: "Courses" },
    { href: "/learn", icon: BookOpen, label: "Learn" },
    { href: "/peer-tutor", icon: Bot, label: "Peer Tutor" },
    { href: "/achievements", icon: Trophy, label: "Achievements" },
    { href: "/profile", icon: User, label: "Profile" },
    { href: "/admin", icon: Plus, label: "Admin" },
  ]

  const handleLogout = () => {
    localStorage.removeItem("eduBuzzX_currentUser")
    setUser(null)
    router.push("/login")
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block">
        <div className="space-y-2">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full",
                pathname === href
                  ? "text-purple-600 bg-purple-50 border-r-2 border-purple-600"
                  : "text-gray-600 hover:text-purple-600 hover:bg-purple-50",
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </Link>
          ))}

          {/* User Info & Logout */}
          {user && (
            <div className="mt-8 pt-4 border-t border-gray-200">
              <div className="px-4 py-2 mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: user.avatar_color }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.total_xp} XP</p>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Navigation - Now with black background for Reels-like experience */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 px-4 py-2 z-50">
        <div className="flex justify-around">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center py-2 px-3 rounded-lg transition-colors",
                pathname === href ? "text-purple-400" : "text-gray-400 hover:text-purple-400",
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs mt-1">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
