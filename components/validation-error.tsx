"use client"

import { AlertCircle, Clock } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useEffect, useState } from "react"

interface ValidationErrorProps {
  message: string
  cooldownRemaining?: number
  onCooldownComplete?: () => void
}

export function ValidationError({ message, cooldownRemaining, onCooldownComplete }: ValidationErrorProps) {
  const [timeRemaining, setTimeRemaining] = useState(cooldownRemaining || 0)

  useEffect(() => {
    if (!cooldownRemaining) return

    setTimeRemaining(cooldownRemaining)
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1000
        if (newTime <= 0) {
          clearInterval(interval)
          onCooldownComplete?.()
          return 0
        }
        return newTime
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [cooldownRemaining, onCooldownComplete])

  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000)
    if (seconds < 60) return `${seconds} second${seconds !== 1 ? "s" : ""}`
    const minutes = Math.floor(seconds / 60)
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Action Blocked</AlertTitle>
      <AlertDescription className="flex flex-col gap-1">
        <p>{message}</p>
        {timeRemaining > 0 && (
          <div className="flex items-center gap-1 text-sm mt-1">
            <Clock className="h-3 w-3" />
            <span>Try again in {formatTime(timeRemaining)}</span>
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}
