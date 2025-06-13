"use client"

import { useState } from "react"
import { Copy, Check, Code2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type CodeExampleProps = {
  data: {
    title: string
    codeExamples: Array<{
      language: string
      code: string
      description?: string
    }>
    content: string
  }
}

export default function CodeExampleResponse({ data }: CodeExampleProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const copyToClipboard = async (code: string, index: number) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error("Failed to copy code:", err)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-3 flex items-center gap-2">
        <div className="bg-blue-100 p-1.5 rounded-full">
          <Code2 className="h-5 w-5 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-blue-600">Code Examples</h3>
      </div>

      <div className="space-y-6">
        {/* Main explanation */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border">
          <h2 className="text-xl font-bold text-gray-800 mb-3">{data.title}</h2>
          <p className="text-gray-700 leading-relaxed">{data.content}</p>
        </div>

        {/* Code examples */}
        {data.codeExamples.map((example, index) => (
          <div key={index} className="bg-white rounded-xl border shadow-sm overflow-hidden">
            {example.description && (
              <div className="px-4 py-3 bg-gray-50 border-b">
                <p className="text-sm text-gray-600">{example.description}</p>
              </div>
            )}

            <div className="relative">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-900 text-white">
                <span className="text-sm font-medium capitalize">{example.language}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-white hover:bg-gray-700"
                  onClick={() => copyToClipboard(example.code, index)}
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>

              <pre className="p-4 bg-gray-50 overflow-x-auto">
                <code className="text-sm font-mono text-gray-800 whitespace-pre">{example.code}</code>
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
