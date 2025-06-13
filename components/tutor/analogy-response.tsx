"use client"

import { Lightbulb } from "lucide-react"

type AnalogyResponseProps = {
  data: {
    title: string
    analogy: string
  }
}

export default function AnalogyResponse({ data }: AnalogyResponseProps) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-2 flex items-center gap-2">
        <div className="bg-amber-100 p-1 rounded-full">
          <Lightbulb className="h-4 w-4 text-amber-600" />
        </div>
        <h3 className="text-sm font-medium text-amber-600">Learning Analogy</h3>
      </div>

      <div className="border rounded-xl p-6 bg-gradient-to-br from-amber-50 to-yellow-50">
        <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <span className="text-amber-500">✨</span>
          {data.title}
        </h2>

        <p className="text-gray-700">{data.analogy}</p>
      </div>
    </div>
  )
}
