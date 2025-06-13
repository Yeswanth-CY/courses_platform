"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useUser } from "@/contexts/user-context"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface ValidatedActionButtonProps {
  action: "video_like" | "video_watch" | "quiz_complete" | "challenge_complete"
  videoId?: string
  metadata?: any
  onSuccess?: () => void
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export function ValidatedActionButton({
  action,
  videoId,
  metadata,
  onSuccess,
  children,
  className,
  disabled,
}: ValidatedActionButtonProps) {
  const { user } = useUser()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleAction = async () => {
    if (!user || isLoading || disabled) return

    setIsLoading(true)

    try {
      const actionData = {
        userId: user.id,
        action,
        videoId,
        timestamp: Date.now(),
        metadata,
      }

      const response = await fetch("/api/user-actions/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(actionData),
      })

      const result = await response.json()

      if (!result.valid) {
        if (result.cooldownRemaining) {
          toast({
            title: "Action Too Frequent",
            description: `Please wait ${Math.ceil(result.cooldownRemaining / 1000)} seconds before trying again.`,
            variant: "destructive",
          })
        } else {
          toast({
            title: "Action Blocked",
            description: result.reason || "This action was blocked for security reasons.",
            variant: "destructive",
          })
        }
        return
      }

      // Action was validated successfully
      onSuccess?.()

      toast({
        title: "Success!",
        description: "Action completed successfully.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error validating action:", error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleAction} disabled={disabled || isLoading || !user} className={className}>
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </Button>
  )
}
