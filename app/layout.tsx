import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navigation } from "@/components/navigation"
import { UserProvider } from "@/contexts/user-context"
import { Toaster } from "@/components/ui/toaster"
import { AuthWrapper } from "@/components/auth-wrapper"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "EduBuzzX - AI-Powered Learning Platform",
  description: "Learn through engaging AI-generated content and interactive challenges",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black min-h-screen`}>
        <UserProvider>
          <AuthWrapper>
            <div className="min-h-screen">
              {/* Desktop/Tablet Layout */}
              <div className="hidden md:flex">
                {/* Sidebar Navigation */}
                <div className="w-64 bg-white shadow-lg fixed h-full">
                  <div className="p-6">
                    <h1 className="text-2xl font-bold text-purple-600 mb-8">EduBuzzX</h1>
                    <Navigation />
                  </div>
                </div>

                {/* Main Content */}
                <div className="ml-64 flex-1">{children}</div>
              </div>

              {/* Mobile Layout */}
              <div className="md:hidden">
                <div className="pb-20">{children}</div>
                <Navigation />
              </div>
            </div>
          </AuthWrapper>
          <Toaster />
        </UserProvider>
      </body>
    </html>
  )
}
