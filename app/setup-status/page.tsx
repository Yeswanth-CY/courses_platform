"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2, Database, AlertTriangle, Sparkles } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface HealthStatus {
  status: "healthy" | "tables_missing" | "connection_error" | "query_error" | "error"
  message: string
  error?: string
  courseCount?: number
}

export default function SetupStatusPage() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    checkHealth()
  }, [])

  const checkHealth = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/health")
      const data = await response.json()
      setHealthStatus(data)
    } catch (error) {
      setHealthStatus({
        status: "error",
        message: "Failed to check database status",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = () => {
    if (loading) return <Loader2 className="w-6 h-6 animate-spin text-blue-600" />

    switch (healthStatus?.status) {
      case "healthy":
        return <CheckCircle className="w-6 h-6 text-green-600" />
      case "tables_missing":
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />
      default:
        return <XCircle className="w-6 h-6 text-red-600" />
    }
  }

  const getStatusColor = () => {
    switch (healthStatus?.status) {
      case "healthy":
        return "border-green-200 bg-green-50"
      case "tables_missing":
        return "border-yellow-200 bg-yellow-50"
      default:
        return "border-red-200 bg-red-50"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <Database className="w-8 h-8 text-purple-600" />
            Database Setup Status
          </h1>
          <p className="text-gray-600">Check if your EduBuzzX database is properly configured</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon()}
              Database Health Check
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className={getStatusColor()}>
              <AlertDescription>
                <div className="space-y-2">
                  <p>
                    <strong>Status:</strong> {healthStatus?.message || "Checking..."}
                  </p>
                  {healthStatus?.courseCount !== undefined && (
                    <p>
                      <strong>Courses found:</strong> {healthStatus.courseCount}
                    </p>
                  )}
                  {healthStatus?.error && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium">Technical Details</summary>
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">{healthStatus.error}</pre>
                    </details>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            <div className="mt-4 flex gap-3">
              <Button onClick={checkHealth} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Recheck Status
              </Button>

              {healthStatus?.status === "healthy" && (
                <Link
                  href="/"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Go to Platform
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        {healthStatus?.status === "tables_missing" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-yellow-800">⚠️ Setup Required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Your database connection is working, but the required tables haven't been created yet.
              </p>

              <div className="bg-gray-900 text-green-400 p-4 rounded-lg">
                <p className="text-sm mb-2">Run this SQL script in your Supabase SQL Editor:</p>
                <p className="text-xs opacity-75">Copy the content from scripts/setup-database.sql and execute it</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Steps to fix:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                  <li>Go to your Supabase project dashboard</li>
                  <li>Navigate to the SQL Editor</li>
                  <li>Copy and paste the setup-database.sql script</li>
                  <li>Click "Run" to execute the script</li>
                  <li>Come back here and click "Recheck Status"</li>
                </ol>
              </div>

              <Link
                href="/setup"
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                View Full Setup Guide
              </Link>
            </CardContent>
          </Card>
        )}

        {healthStatus?.status === "healthy" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-800">✅ All Set!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">Your database is properly configured and ready to use. You can now:</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center">
                  <div className="text-2xl mb-2">🏠</div>
                  <h3 className="font-semibold">View Platform</h3>
                  <p className="text-sm text-gray-600">Browse courses and videos</p>
                </Link>

                <Link href="/admin" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center">
                  <div className="text-2xl mb-2">⚙️</div>
                  <h3 className="font-semibold">Admin Panel</h3>
                  <p className="text-sm text-gray-600">Manage content</p>
                </Link>

                <Link href="/learn" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center">
                  <div className="text-2xl mb-2">🎓</div>
                  <h3 className="font-semibold">Start Learning</h3>
                  <p className="text-sm text-gray-600">AI-powered lessons</p>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
