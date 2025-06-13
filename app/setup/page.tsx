"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CheckCircle, Copy, Database, Key, Sparkles } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

export default function SetupPage() {
  const [copiedStep, setCopiedStep] = useState<number | null>(null)
  const { toast } = useToast()

  const copyToClipboard = (text: string, step: number) => {
    navigator.clipboard.writeText(text)
    setCopiedStep(step)
    setTimeout(() => setCopiedStep(null), 2000)
    toast({
      title: "Copied!",
      description: "Code copied to clipboard",
    })
  }

  const sqlScript = `-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create videos table
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  course TEXT NOT NULL,
  topic TEXT NOT NULL,
  drive_url TEXT NOT NULL,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create learning_content table for AI-generated content
CREATE TABLE IF NOT EXISTS public.learning_content (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
  xp_earned INTEGER DEFAULT 0,
  quiz_score INTEGER,
  challenge_completed BOOLEAN DEFAULT FALSE,
  challenge_response TEXT,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Enable all access for videos" ON public.videos FOR ALL USING (true);
CREATE POLICY "Enable all access for learning_content" ON public.learning_content FOR ALL USING (true);
CREATE POLICY "Enable all access for user_progress" ON public.user_progress FOR ALL USING (true);`

  const envExample = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key`

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-600" />
            EduBuzzX Setup Guide
          </h1>
          <p className="text-gray-600">Follow these steps to set up your AI-powered learning platform</p>
        </div>

        <div className="space-y-6">
          {/* Step 1: Supabase Setup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                Step 1: Set up Supabase Database
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  Go to{" "}
                  <a
                    href="https://supabase.com"
                    className="text-blue-600 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    supabase.com
                  </a>{" "}
                  and create a new project
                </li>
                <li>Navigate to the SQL Editor in your Supabase dashboard</li>
                <li>Copy and run the following SQL script:</li>
              </ol>

              <div className="relative">
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">
                  <code>{sqlScript}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(sqlScript, 1)}
                >
                  {copiedStep === 1 ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>

              <Alert>
                <AlertDescription>
                  This creates all necessary tables for videos, AI-generated content, and user progress tracking.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Step 2: Environment Variables */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-green-600" />
                Step 2: Configure Environment Variables
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Get your Supabase URL and keys from Project Settings → API</li>
                <li>
                  Get your Gemini API key from{" "}
                  <a
                    href="https://makersuite.google.com/app/apikey"
                    className="text-blue-600 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Google AI Studio
                  </a>
                </li>
                <li>
                  Create a <code className="bg-gray-100 px-1 rounded">.env.local</code> file in your project root:
                </li>
              </ol>

              <div className="relative">
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">
                  <code>{envExample}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(envExample, 2)}
                >
                  {copiedStep === 2 ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>

              <Alert>
                <AlertDescription>
                  Replace the placeholder values with your actual keys. Never commit these to version control!
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Step 3: How it Works */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Step 3: How Your Platform Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-purple-800">📹 Video Upload Process:</h4>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>• Upload Google Drive video links via admin panel</li>
                    <li>• AI generates engaging video summaries</li>
                    <li>• Videos appear in the main feed</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-blue-800">🤖 AI Content Generation:</h4>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>• Interactive visual notes with emojis</li>
                    <li>• Multiple-choice quizzes with explanations</li>
                    <li>• Flashcards for key terms</li>
                    <li>• Glossary definitions</li>
                    <li>• Fun analogies and challenges</li>
                  </ul>
                </div>
              </div>

              <Alert className="border-green-200 bg-green-50">
                <AlertDescription>
                  <strong>🎯 Learning Flow:</strong> Students watch videos → AI generates personalized content →
                  Interactive learning with XP rewards → Progress tracking and achievements!
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Step 4: Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>🚀 Ready to Launch!</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">Once you've completed the setup:</p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>
                    Go to the{" "}
                    <a href="/admin" className="text-purple-600 hover:underline">
                      Admin Panel
                    </a>{" "}
                    to upload your first video
                  </li>
                  <li>Test the AI content generation</li>
                  <li>Share the platform with your learners</li>
                  <li>Monitor progress and engagement</li>
                </ol>

                <div className="flex gap-4 mt-6">
                  <Button asChild>
                    <a href="/admin">Go to Admin Panel</a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/">View Learning Platform</a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
