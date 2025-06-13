"use client"

import { Zap } from "lucide-react"

type QuickTipProps = {
  data: {
    title: string
    tips: string[]
  }
}

export default function QuickTipResponse({ data }: QuickTipProps) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-2 flex items-center gap-2">
        <div className="bg-pink-100 p-1 rounded-full">
          <Zap className="h-4 w-4 text-pink-600" />
        </div>
        <h3 className="text-sm font-medium text-pink-600">Quick Tips</h3>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-pink-50 to-rose-50 border-b">
          <h2 className="text-lg font-bold text-gray-800">{data.title}</h2>
        </div>

        <div className="p-4 bg-white">
          <ul className="space-y-3">
            {data.tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-pink-500 font-bold mt-0.5">•</span>
                <span className="text-gray-700">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
