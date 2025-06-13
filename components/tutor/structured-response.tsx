"use client"

import { BookOpen, Lightbulb, Target, Zap } from "lucide-react"

type StructuredResponseProps = {
  data: {
    title: string
    content: string
    sections: Array<{
      heading: string
      content: string
    }>
    tips: string[]
    keyPoints: string[]
    analogy?: string
  }
}

export default function StructuredResponse({ data }: StructuredResponseProps) {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <div className="bg-green-100 p-1.5 rounded-full">
          <BookOpen className="h-5 w-5 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-green-600">Learning Guide</h3>
      </div>

      {/* Main content */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border">
        <h2 className="text-xl font-bold text-gray-800 mb-4">{data.title}</h2>
        <p className="text-gray-700 leading-relaxed">{data.content}</p>
      </div>

      {/* Sections */}
      {data.sections.length > 0 && (
        <div className="space-y-4">
          {data.sections.map((section, index) => (
            <div key={index} className="bg-white rounded-lg border p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </span>
                {section.heading}
              </h3>
              <p className="text-gray-700 leading-relaxed pl-8">{section.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Analogy */}
      {data.analogy && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-5 border border-amber-200">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-5 w-5 text-amber-600" />
            <h3 className="font-semibold text-amber-800">Think of it this way</h3>
          </div>
          <p className="text-amber-800 leading-relaxed">{data.analogy}</p>
        </div>
      )}

      {/* Key Points */}
      {data.keyPoints.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-200">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-purple-800">Key Takeaways</h3>
          </div>
          <ul className="space-y-2">
            {data.keyPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-2 text-purple-800">
                <span className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></span>
                <span className="leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tips */}
      {data.tips.length > 0 && (
        <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-5 border border-pink-200">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-pink-600" />
            <h3 className="font-semibold text-pink-800">Pro Tips</h3>
          </div>
          <ul className="space-y-2">
            {data.tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2 text-pink-800">
                <span className="text-pink-500 font-bold mt-0.5">💡</span>
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
