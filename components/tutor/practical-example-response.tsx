"use client"

import { Target, AlertCircle, CheckCircle, Lightbulb } from "lucide-react"

type PracticalExampleProps = {
  data: {
    title: string
    scenario: string
    problem: string
    solution: string
    outcome: string
  }
}

export default function PracticalExampleResponse({ data }: PracticalExampleProps) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-2 flex items-center gap-2">
        <div className="bg-green-100 p-1 rounded-full">
          <Target className="h-4 w-4 text-green-600" />
        </div>
        <h3 className="text-sm font-medium text-green-600">Practical Example</h3>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b">
          <h2 className="text-lg font-bold text-gray-800">{data.title}</h2>
        </div>

        <div className="p-4 bg-white">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="h-4 w-4 text-blue-500" />
              <h3 className="text-sm font-medium text-blue-600">Scenario</h3>
            </div>
            <p className="text-gray-700 pl-6">{data.scenario}</p>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <h3 className="text-sm font-medium text-red-600">Problem</h3>
            </div>
            <p className="text-gray-700 pl-6">{data.problem}</p>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <h3 className="text-sm font-medium text-green-600">Solution</h3>
            </div>
            <p className="text-gray-700 pl-6">{data.solution}</p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-purple-500" />
              <h3 className="text-sm font-medium text-purple-600">Outcome</h3>
            </div>
            <p className="text-gray-700 pl-6">{data.outcome}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
