"use client"

import { Lightbulb, Target, CheckCircle, TrendingUp } from "lucide-react"

interface PracticalExample {
  id: number
  scenario: string
  problem: string
  solution: string
  outcome: string
}

interface PracticalExamplesProps {
  examples: PracticalExample[]
  topic?: string
}

export function PracticalExamples({ examples, topic }: PracticalExamplesProps) {
  if (!examples || !Array.isArray(examples) || examples.length === 0) {
    return null
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-bold text-gray-800">Practical Examples</h3>
        {topic && <span className="text-sm text-gray-600">for {topic}</span>}
      </div>

      <div className="space-y-6">
        {examples.map((example, index) => (
          <div key={example.id || index} className="bg-white rounded-lg p-5 shadow-sm">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-blue-500" />
                    <h4 className="font-semibold text-blue-800">Scenario</h4>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {typeof example.scenario === "string" ? example.scenario : "No scenario provided"}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-red-500" />
                    <h4 className="font-semibold text-red-800">Problem</h4>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {typeof example.problem === "string" ? example.problem : "No problem provided"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <h4 className="font-semibold text-green-800">Solution</h4>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {typeof example.solution === "string" ? example.solution : "No solution provided"}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    <h4 className="font-semibold text-purple-800">Outcome</h4>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {typeof example.outcome === "string" ? example.outcome : "No outcome provided"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
