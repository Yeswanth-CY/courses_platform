/**
 * Extracts YouTube video ID from various YouTube URL formats
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null

  try {
    // Handle various YouTube URL formats
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/i,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^/?]+)/i,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^/?]+)/i,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^/?]+)/i,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/user\/[^/]+\/?\?v=([^&]+)/i,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    return null
  } catch (error) {
    console.error("Error extracting YouTube ID:", error)
    return null
  }
}

/**
 * Generates a thumbnail URL for a YouTube video
 */
export function getYouTubeThumbnail(
  videoId: string,
  quality: "default" | "medium" | "high" | "standard" | "maxres" = "high",
): string {
  const qualityMap = {
    default: "default",
    medium: "mqdefault",
    high: "hqdefault",
    standard: "sddefault",
    maxres: "maxresdefault",
  }

  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`
}

/**
 * Checks if a YouTube video exists and is embeddable
 */
export async function checkYouTubeVideo(videoId: string): Promise<{ exists: boolean; embeddable: boolean }> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=status&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`,
    )
    const data = await response.json()

    if (!data.items || data.items.length === 0) {
      return { exists: false, embeddable: false }
    }

    return {
      exists: true,
      embeddable: data.items[0].status.embeddable === true,
    }
  } catch (error) {
    console.error("Error checking YouTube video:", error)
    // Assume it exists but might not be embeddable if we can't check
    return { exists: true, embeddable: false }
  }
}
