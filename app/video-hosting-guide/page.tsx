"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, ExternalLink, Star, DollarSign, Shield, Globe, Upload, Play, Settings } from "lucide-react"

export default function VideoHostingGuide() {
  const hostingOptions = [
    {
      name: "Vimeo",
      description: "Professional video hosting with excellent embedding support",
      pricing: "Free tier available, Pro from $7/month",
      pros: [
        "Excellent embedding support",
        "No ads on videos",
        "High quality playback",
        "Privacy controls",
        "Custom players",
      ],
      cons: ["Limited storage on free plan", "Upload limits on free tier"],
      embedExample: "https://vimeo.com/123456789",
      embedFormat: "https://player.vimeo.com/video/VIDEO_ID",
      rating: 5,
      recommended: true,
      color: "blue",
      icon: "🎬",
    },
    {
      name: "Loom",
      description: "Perfect for educational content and screen recordings",
      pricing: "Free tier available, Business from $8/month",
      pros: [
        "Great for educational content",
        "Easy screen recording",
        "Automatic transcriptions",
        "Viewer engagement analytics",
        "Password protection",
      ],
      cons: ["Limited to 5 minutes on free plan", "Focused on screen recordings"],
      embedExample: "https://www.loom.com/share/abc123def456",
      embedFormat: "https://www.loom.com/embed/VIDEO_ID",
      rating: 5,
      recommended: true,
      color: "purple",
      icon: "📹",
    },
    {
      name: "Wistia",
      description: "Business-focused video hosting with advanced analytics",
      pricing: "Free for 3 videos, Pro from $99/month",
      pros: [
        "Excellent embedding",
        "Advanced analytics",
        "Lead generation tools",
        "Custom CTAs",
        "No branding on free plan",
      ],
      cons: ["Expensive for large volumes", "Only 3 videos on free plan"],
      embedExample: "https://wistia.com/medias/abc123def456",
      embedFormat: "https://fast.wistia.net/embed/iframe/VIDEO_ID",
      rating: 4,
      recommended: false,
      color: "green",
      icon: "📊",
    },
    {
      name: "Cloudinary",
      description: "Cloud-based media management with video optimization",
      pricing: "Free tier available, Pro from $89/month",
      pros: [
        "Automatic optimization",
        "Global CDN",
        "Video transformations",
        "Reliable embedding",
        "Developer-friendly",
      ],
      cons: ["More technical setup", "Limited free tier"],
      embedExample: "https://res.cloudinary.com/demo/video/upload/v1234567890/sample.mp4",
      embedFormat: "Direct video URL",
      rating: 4,
      recommended: false,
      color: "orange",
      icon: "☁️",
    },
    {
      name: "Streamable",
      description: "Simple video hosting with easy sharing",
      pricing: "Free with limitations, Pro from $5/month",
      pros: ["Very easy to use", "Good embedding support", "Fast uploads", "Mobile-friendly"],
      cons: ["Limited customization", "Basic analytics", "File size limits"],
      embedExample: "https://streamable.com/abc123",
      embedFormat: "https://streamable.com/e/VIDEO_ID",
      rating: 3,
      recommended: false,
      color: "pink",
      icon: "🎥",
    },
    {
      name: "JW Player",
      description: "Enterprise video platform with robust features",
      pricing: "Starts from $15/month",
      pros: ["Enterprise-grade", "Excellent performance", "Advanced analytics", "Live streaming support", "Global CDN"],
      cons: ["No free tier", "Complex setup", "Expensive"],
      embedExample: "https://cdn.jwplayer.com/players/abc123-def456.html",
      embedFormat: "JW Player embed URL",
      rating: 4,
      recommended: false,
      color: "gray",
      icon: "🏢",
    },
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "border-blue-200 bg-blue-50 text-blue-800",
      purple: "border-purple-200 bg-purple-50 text-purple-800",
      green: "border-green-200 bg-green-50 text-green-800",
      orange: "border-orange-200 bg-orange-50 text-orange-800",
      pink: "border-pink-200 bg-pink-50 text-pink-800",
      gray: "border-gray-200 bg-gray-50 text-gray-800",
    }
    return colors[color as keyof typeof colors] || colors.gray
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            🎥 Video Hosting Guide
          </h1>
          <p className="text-gray-600">Best alternatives to YouTube for embedding videos in EduBuzzX</p>
        </div>

        {/* Quick Recommendations */}
        <Alert className="mb-8 border-green-200 bg-green-50">
          <Star className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Top Recommendations:</strong> For educational content, we highly recommend <strong>Vimeo</strong>{" "}
            (professional) or <strong>Loom</strong> (screen recordings). Both have excellent embedding support and are
            perfect for learning platforms.
          </AlertDescription>
        </Alert>

        {/* Hosting Options Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {hostingOptions.map((option, index) => (
            <Card key={index} className={`relative ${option.recommended ? "ring-2 ring-green-500" : ""}`}>
              {option.recommended && (
                <div className="absolute -top-3 left-4">
                  <Badge className="bg-green-600 text-white">
                    <Star className="w-3 h-3 mr-1" />
                    Recommended
                  </Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{option.icon}</span>
                    <span>{option.name}</span>
                  </div>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < option.rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                </CardTitle>
                <p className="text-gray-600 text-sm">{option.description}</p>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Pricing */}
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">{option.pricing}</span>
                </div>

                {/* Pros */}
                <div>
                  <h4 className="text-sm font-semibold text-green-800 mb-2">✅ Pros:</h4>
                  <ul className="text-xs space-y-1">
                    {option.pros.map((pro, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Cons */}
                <div>
                  <h4 className="text-sm font-semibold text-red-800 mb-2">❌ Cons:</h4>
                  <ul className="text-xs space-y-1">
                    {option.cons.map((con, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <span className="w-3 h-3 text-red-600 flex-shrink-0">•</span>
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Embed Example */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">📝 URL Format:</h4>
                  <code className="text-xs bg-gray-100 p-2 rounded block break-all">{option.embedExample}</code>
                </div>

                {/* Action Button */}
                <Button
                  className="w-full"
                  onClick={() => window.open(`https://${option.name.toLowerCase()}.com`, "_blank")}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visit {option.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Setup Guide */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-600" />
              Quick Setup Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">1. Upload Video</h3>
                <p className="text-sm text-gray-600">Upload your video to your chosen platform (Vimeo, Loom, etc.)</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">2. Set Privacy</h3>
                <p className="text-sm text-gray-600">
                  Make sure the video is set to "Public" or "Unlisted" with embedding enabled
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Globe className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">3. Copy URL</h3>
                <p className="text-sm text-gray-600">Copy the video URL and paste it into your EduBuzzX admin panel</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Platform</th>
                    <th className="text-left p-2">Free Tier</th>
                    <th className="text-left p-2">Embedding</th>
                    <th className="text-left p-2">Best For</th>
                    <th className="text-left p-2">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {hostingOptions.map((option, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 font-medium">
                        {option.icon} {option.name}
                      </td>
                      <td className="p-2">
                        {option.pricing.includes("Free") ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Yes
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-red-100 text-red-800">
                            No
                          </Badge>
                        )}
                      </td>
                      <td className="p-2">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Excellent
                        </Badge>
                      </td>
                      <td className="p-2 text-xs">
                        {option.name === "Vimeo" && "Professional videos"}
                        {option.name === "Loom" && "Screen recordings"}
                        {option.name === "Wistia" && "Business content"}
                        {option.name === "Cloudinary" && "Developers"}
                        {option.name === "Streamable" && "Quick sharing"}
                        {option.name === "JW Player" && "Enterprise"}
                      </td>
                      <td className="p-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < option.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <Alert className="border-purple-200 bg-purple-50 mb-4">
            <Play className="w-4 h-4 text-purple-600" />
            <AlertDescription className="text-purple-800">
              <strong>Ready to get started?</strong> We recommend trying Vimeo or Loom first. Both have generous free
              tiers and work perfectly with EduBuzzX!
            </AlertDescription>
          </Alert>

          <div className="flex gap-4 justify-center">
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <a href="https://vimeo.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Try Vimeo
              </a>
            </Button>
            <Button asChild className="bg-purple-600 hover:bg-purple-700">
              <a href="https://loom.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Try Loom
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="/admin">
                <Settings className="w-4 h-4 mr-2" />
                Go to Admin Panel
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
