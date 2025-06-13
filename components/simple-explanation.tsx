"use client"

import { Lightbulb } from "lucide-react"

interface SimpleExplanationProps {
  title?: string
  explanation?: string
  keyPoints?: string[]
  content?: string
}

export function SimpleExplanation({ title, explanation, keyPoints, content }: SimpleExplanationProps) {
  // Handle both content string and structured explanation
  const displayTitle = title || "Simple Explanation"
  const displayExplanation = explanation || content || "No explanation available"
  const displayKeyPoints = keyPoints || []

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-bold text-gray-800">Simple Explanation</h3>
      </div>

      <div className="bg-white rounded-lg p-5 shadow-sm">
        <h4 className="font-semibold text-blue-800 mb-3 text-lg">{displayTitle}</h4>

        <p className="text-gray-700 leading-relaxed mb-4 text-base">{displayExplanation}</p>

        {displayKeyPoints.length > 0 && (
          <div className="space-y-2">
            <h5 className="font-medium text-gray-800 text-sm uppercase tracking-wide">Key Points:</h5>
            <ul className="space-y-2">
              {displayKeyPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-gray-700 text-sm leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
