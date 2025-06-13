"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Lightbulb } from "lucide-react"

interface ChallengeInputProps {
  topic: string
  onSubmit: (explanation: string) => void
}

export function ChallengeInput({ topic, onSubmit }: ChallengeInputProps) {
  const [explanation, setExplanation] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = () => {
    if (explanation.trim()) {
      onSubmit(explanation)
      setIsSubmitted(true)
    }
  }

  if (isSubmitted) {
    return (
      <div className="bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl p-6 mb-6">
        <div className="text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h3 className="text-lg font-bold text-green-800 mb-2">Great job!</h3>
          <p className="text-green-700 text-sm">Your explanation has been submitted. Keep up the excellent work!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-pink-100 to-rose-100 rounded-xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-pink-600" />
        <h3 className="text-lg font-bold text-gray-800">Challenge</h3>
      </div>

      <p className="text-gray-700 mb-4">
        Explain <strong>{topic}</strong> in your own words. This helps reinforce your understanding!
      </p>

      <Textarea
        value={explanation}
        onChange={(e) => setExplanation(e.target.value)}
        placeholder="Type your explanation here..."
        className="mb-4 min-h-[100px] resize-none"
      />

      <Button
        onClick={handleSubmit}
        disabled={!explanation.trim()}
        className="w-full bg-pink-600 hover:bg-pink-700 flex items-center gap-2"
      >
        <Send className="w-4 h-4" />
        Submit Explanation
      </Button>
    </div>
  )
}
