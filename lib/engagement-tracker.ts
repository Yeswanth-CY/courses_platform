export interface EngagementMetrics {
  totalTimeSpent: number // Total time on page
  actualWatchTime: number // Time video was actually playing
  videoProgress: number // How much of video was watched
  tabSwitches: number // Number of times user switched tabs
  pauseEvents: number // Number of times video was paused
  seekEvents: number // Number of times user seeked in video
  focusTime: number // Time spent with tab in focus
  engagementScore: number // Overall engagement score (0-100)
}

export interface EngagementEvent {
  type: "play" | "pause" | "seek" | "tab_switch" | "tab_return" | "video_progress"
  timestamp: number
  videoCurrentTime?: number
  videoProgress?: number
  metadata?: any
}

export class EngagementTracker {
  private videoElement: HTMLVideoElement | null = null
  private startTime = 0
  private actualWatchTime = 0
  private lastVideoTime = 0
  private isVideoPlaying = false
  private isTabVisible = true
  private isWindowFocused = true
  private events: EngagementEvent[] = []
  private metrics: EngagementMetrics = {
    totalTimeSpent: 0,
    actualWatchTime: 0,
    videoProgress: 0,
    tabSwitches: 0,
    pauseEvents: 0,
    seekEvents: 0,
    focusTime: 0,
    engagementScore: 0,
  }

  private onVisibilityChange = () => {
    const isVisible = !document.hidden
    const now = Date.now()

    if (isVisible !== this.isTabVisible) {
      this.isTabVisible = isVisible

      if (isVisible) {
        this.addEvent("tab_return", now)
      } else {
        this.addEvent("tab_switch", now)
        this.metrics.tabSwitches++
        // Pause video tracking when tab is not visible
        if (this.isVideoPlaying) {
          this.pauseWatchTracking()
        }
      }
    }
  }

  private onWindowFocus = () => {
    this.isWindowFocused = true
    if (this.isTabVisible && this.isVideoPlaying) {
      this.resumeWatchTracking()
    }
  }

  private onWindowBlur = () => {
    this.isWindowFocused = false
    if (this.isVideoPlaying) {
      this.pauseWatchTracking()
    }
  }

  private addEvent(type: EngagementEvent["type"], timestamp: number, metadata?: any) {
    this.events.push({
      type,
      timestamp,
      videoCurrentTime: this.videoElement?.currentTime,
      videoProgress: this.getVideoProgress(),
      metadata,
    })
  }

  private getVideoProgress(): number {
    if (!this.videoElement) return 0
    return (this.videoElement.currentTime / this.videoElement.duration) * 100
  }

  private pauseWatchTracking() {
    if (this.isVideoPlaying) {
      const now = Date.now()
      this.actualWatchTime += (now - this.startTime) / 1000
      this.isVideoPlaying = false
    }
  }

  private resumeWatchTracking() {
    if (!this.isVideoPlaying && this.videoElement && !this.videoElement.paused) {
      this.startTime = Date.now()
      this.isVideoPlaying = true
    }
  }

  public startTracking(videoElement?: HTMLVideoElement) {
    this.videoElement = videoElement || null
    this.startTime = Date.now()

    // Add event listeners
    document.addEventListener("visibilitychange", this.onVisibilityChange)
    window.addEventListener("focus", this.onWindowFocus)
    window.addEventListener("blur", this.onWindowBlur)

    // Video-specific tracking
    if (this.videoElement) {
      this.videoElement.addEventListener("play", this.onVideoPlay)
      this.videoElement.addEventListener("pause", this.onVideoPause)
      this.videoElement.addEventListener("seeked", this.onVideoSeek)
      this.videoElement.addEventListener("timeupdate", this.onVideoTimeUpdate)
    }

    this.addEvent("play", Date.now())
  }

  private onVideoPlay = () => {
    const now = Date.now()
    this.addEvent("play", now)

    if (this.isTabVisible && this.isWindowFocused) {
      this.startTime = now
      this.isVideoPlaying = true
    }
  }

  private onVideoPause = () => {
    const now = Date.now()
    this.addEvent("pause", now)
    this.metrics.pauseEvents++
    this.pauseWatchTracking()
  }

  private onVideoSeek = () => {
    const now = Date.now()
    this.addEvent("seek", now)
    this.metrics.seekEvents++

    // Reset tracking after seek
    if (this.isVideoPlaying) {
      this.startTime = now
    }
  }

  private onVideoTimeUpdate = () => {
    if (!this.videoElement) return

    const currentTime = this.videoElement.currentTime
    const timeDiff = Math.abs(currentTime - this.lastVideoTime)

    // Detect if user is actually watching (video time progresses naturally)
    if (timeDiff > 0.5 && timeDiff < 2) {
      // Normal playback speed
      this.lastVideoTime = currentTime
      this.addEvent("video_progress", Date.now())
    }
  }

  public stopTracking(): EngagementMetrics {
    const now = Date.now()

    // Calculate final metrics
    this.metrics.totalTimeSpent = (now - this.startTime) / 1000

    if (this.isVideoPlaying) {
      this.actualWatchTime += (now - this.startTime) / 1000
    }

    this.metrics.actualWatchTime = this.actualWatchTime
    this.metrics.videoProgress = this.getVideoProgress()

    // Calculate focus time (time spent with tab visible and window focused)
    this.metrics.focusTime = this.calculateFocusTime()

    // Calculate engagement score
    this.metrics.engagementScore = this.calculateEngagementScore()

    // Clean up event listeners
    document.removeEventListener("visibilitychange", this.onVisibilityChange)
    window.removeEventListener("focus", this.onWindowFocus)
    window.removeEventListener("blur", this.onWindowBlur)

    if (this.videoElement) {
      this.videoElement.removeEventListener("play", this.onVideoPlay)
      this.videoElement.removeEventListener("pause", this.onVideoPause)
      this.videoElement.removeEventListener("seeked", this.onVideoSeek)
      this.videoElement.removeEventListener("timeupdate", this.onVideoTimeUpdate)
    }

    return this.metrics
  }

  private calculateFocusTime(): number {
    let focusTime = 0
    let lastFocusStart = this.startTime
    let isFocused = true

    for (const event of this.events) {
      if (event.type === "tab_switch") {
        if (isFocused) {
          focusTime += (event.timestamp - lastFocusStart) / 1000
          isFocused = false
        }
      } else if (event.type === "tab_return") {
        if (!isFocused) {
          lastFocusStart = event.timestamp
          isFocused = true
        }
      }
    }

    // Add remaining focus time
    if (isFocused) {
      focusTime += (Date.now() - lastFocusStart) / 1000
    }

    return focusTime
  }

  private calculateEngagementScore(): number {
    const { totalTimeSpent, actualWatchTime, videoProgress, tabSwitches, focusTime } = this.metrics

    if (totalTimeSpent === 0) return 0

    // Base score from actual watch time vs total time
    const watchRatio = Math.min(actualWatchTime / totalTimeSpent, 1)
    let score = watchRatio * 40 // Max 40 points

    // Bonus for video progress
    score += (videoProgress / 100) * 30 // Max 30 points

    // Bonus for focus time
    const focusRatio = Math.min(focusTime / totalTimeSpent, 1)
    score += focusRatio * 20 // Max 20 points

    // Penalty for excessive tab switching
    const tabSwitchPenalty = Math.min(tabSwitches * 2, 10)
    score -= tabSwitchPenalty

    // Bonus for consistent watching (fewer pauses)
    const pausePenalty = Math.min(this.metrics.pauseEvents * 1, 10)
    score -= pausePenalty

    return Math.max(0, Math.min(100, score))
  }

  public getEvents(): EngagementEvent[] {
    return [...this.events]
  }

  public getCurrentMetrics(): EngagementMetrics {
    const now = Date.now()
    const currentMetrics = { ...this.metrics }

    currentMetrics.totalTimeSpent = (now - this.startTime) / 1000
    currentMetrics.actualWatchTime = this.actualWatchTime + (this.isVideoPlaying ? (now - this.startTime) / 1000 : 0)
    currentMetrics.videoProgress = this.getVideoProgress()
    currentMetrics.focusTime = this.calculateFocusTime()
    currentMetrics.engagementScore = this.calculateEngagementScore()

    return currentMetrics
  }
}
