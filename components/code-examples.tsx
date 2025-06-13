"use client"

import { Code, Play, Terminal, Lightbulb } from "lucide-react"

interface CodeExample {
  id: number
  title: string
  description: string
  code: string
  output?: string
  explanation: string
  language?: string
}

interface CodeExamplesProps {
  examples: CodeExample[]
  language?: string
}

export function CodeExamples({ examples, language }: CodeExamplesProps) {
  if (!examples || !Array.isArray(examples) || examples.length === 0) {
    return null
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Code className="w-5 h-5 text-slate-600" />
        <h3 className="text-lg font-bold text-gray-800">Code Examples</h3>
        {language && <span className="text-sm text-gray-600">({language})</span>}
      </div>

      <div className="space-y-6">
        {examples.map((example, index) => (
          <div key={example.id || index} className="bg-white rounded-lg overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-2">
                {typeof example.title === "string" ? example.title : `Example ${index + 1}`}
              </h4>
              <p className="text-gray-600 text-sm">
                {typeof example.description === "string" ? example.description : "Code example"}
              </p>
            </div>

            <div className="bg-gray-900 text-gray-100 p-4 overflow-x-auto">
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-400 uppercase tracking-wide">
                  {example.language || language || "Code"}
                </span>
              </div>
              <pre className="text-sm leading-relaxed">
                <code>{typeof example.code === "string" ? example.code : "// No code provided"}</code>
              </pre>
            </div>

            {example.output && typeof example.output === "string" && (
              <div className="bg-gray-100 p-4 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Play className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-gray-600 uppercase tracking-wide">Output</span>
                </div>
                <pre className="text-sm text-gray-800 bg-white p-3 rounded border">
                  <code>{example.output}</code>
                </pre>
              </div>
            )}

            <div className="p-4 bg-blue-50">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Explanation</span>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                {typeof example.explanation === "string" ? example.explanation : "No explanation provided"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
