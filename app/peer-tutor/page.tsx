"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Bot, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/user-context"

// Import the new dynamic response component
import DynamicResponse from "@/components/tutor/dynamic-response"

// Types
type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  responseData?: any
}

export default function PeerTutorPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const { user } = useUser()

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            "Hi there! I'm your Peer Tutor. Ask me anything about programming concepts, request code examples, or get step-by-step explanations!",
          timestamp: new Date(),
          responseData: {
            type: "comprehensive_guide",
            title: "Welcome to Your AI Peer Tutor! 🎓",
            overview: "I'm here to help you learn programming concepts through interactive, personalized explanations.",
            learningObjectives: [
              "Get detailed explanations of programming concepts",
              "See practical code examples with proper formatting",
              "Practice with guided exercises and solutions",
              "Learn through analogies and real-world applications",
            ],
            quickReference: [
              "Ask 'Explain [concept]' for detailed explanations",
              "Request 'Show me code for [task]' for examples",
              "Say 'Give me practice with [topic]' for exercises",
              "Ask 'Compare [A] vs [B]' for comparisons",
            ],
          },
        },
      ])
    }
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    setInput("")
    setIsLoading(true)

    try {
      // Call Peer Tutor API
      const response = await fetch("/api/peer-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentInput,
          userId: user?.id || "anonymous",
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Add assistant message with dynamic response data
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content || "Here's what I found for you!",
        timestamp: new Date(),
        responseData: data,
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Award XP for using the tutor
      if (user) {
        try {
          const xpResponse = await fetch("/api/user-actions/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              action: "peer_tutor_question",
              points: 15,
              metadata: { question: currentInput, responseType: data.type },
            }),
          })

          if (xpResponse.ok) {
            toast({
              title: "🎉 +15 XP",
              description: "For asking a great question!",
              duration: 3000,
            })
          }
        } catch (xpError) {
          console.error("Failed to award XP:", xpError)
          toast({
            title: "Question Answered! 🤖",
            description: "Great question! Keep learning!",
            duration: 3000,
          })
        }
      }
    } catch (error) {
      console.error("Error:", error)

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm having trouble connecting right now, but I'm here to help!",
        timestamp: new Date(),
        responseData: {
          type: "fallback",
          title: "Connection Issue 🔧",
          content: "I'm currently experiencing technical difficulties, but I'll be back online soon!",
          suggestions: [
            "Try refreshing the page and asking again",
            "Check your internet connection",
            "Your question was: " + currentInput,
            "I'll be ready to help once I'm back online!",
          ],
        },
      }

      setMessages((prev) => [...prev, errorMessage])

      toast({
        title: "Connection Issue",
        description: "I'm having trouble connecting, but I've provided a helpful response!",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto">
      <div className="flex items-center gap-2 p-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="bg-purple-100 p-2 rounded-full">
          <Bot className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Peer Tutor</h1>
          <p className="text-sm text-gray-600">Your AI learning companion with dynamic responses</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[90%] rounded-2xl p-4 ${
                message.role === "user" ? "bg-purple-600 text-white shadow-lg" : "bg-transparent"
              }`}
            >
              {message.role === "user" ? (
                <p className="leading-relaxed">{message.content}</p>
              ) : (
                <DynamicResponse data={message.responseData} />
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border shadow-sm rounded-2xl p-6 flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
              <span className="text-gray-600">Generating your personalized learning content...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t bg-white flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything: 'Explain loops', 'Show me Python examples', 'Give me practice exercises'..."
            className="w-full p-3 pr-10 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isLoading}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
            </div>
          )}
        </div>
        <Button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="rounded-full bg-purple-600 hover:bg-purple-700 h-12 w-12 p-0 flex items-center justify-center shadow-lg"
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  )
}
