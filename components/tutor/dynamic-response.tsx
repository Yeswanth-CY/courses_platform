"use client"

import { useState } from "react"
import { Copy, Check, Code2, BookOpen, Zap, Target, Lightbulb, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

type DynamicResponseProps = {
  data: any
}

export default function DynamicResponse({ data }: DynamicResponseProps) {
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

  // Render based on response type
  switch (data.type) {
    case "code_example":
      return <CodeExampleResponse data={data} copyToClipboard={copyToClipboard} copiedIndex={copiedIndex} />
    case "structured_explanation":
      return <StructuredExplanationResponse data={data} />
    case "comparison":
      return <ComparisonResponse data={data} />
    case "step_by_step":
      return <StepByStepResponse data={data} copyToClipboard={copyToClipboard} copiedIndex={copiedIndex} />
    case "practice_exercise":
      return <PracticeExerciseResponse data={data} copyToClipboard={copyToClipboard} copiedIndex={copiedIndex} />
    case "comprehensive_guide":
      return <ComprehensiveGuideResponse data={data} />
    default:
      return <FallbackResponse data={data} />
  }
}

function CodeExampleResponse({ data, copyToClipboard, copiedIndex }: any) {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Title and Explanation */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Code2 className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">{data.title}</h2>
        </div>
        <p className="text-gray-700 leading-relaxed text-base">{data.explanation}</p>
      </div>

      {/* Code Examples */}
      {data.codeExamples?.map((example: any, index: number) => (
        <div key={index} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {example.description && (
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-700">{example.description}</p>
            </div>
          )}

          <div className="relative">
            <div className="flex items-center justify-between px-6 py-3 bg-gray-900 text-white">
              <span className="text-sm font-medium capitalize flex items-center gap-2">
                <Code2 className="h-4 w-4" />
                {example.language}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-3 text-white hover:bg-gray-700 transition-colors"
                onClick={() => copyToClipboard(example.code, index)}
              >
                {copiedIndex === index ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Code
                  </>
                )}
              </Button>
            </div>

            <div className="p-6 bg-gray-50">
              <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                {example.code}
              </pre>
            </div>
          </div>
        </div>
      ))}

      {/* Key Points */}
      {data.keyPoints && data.keyPoints.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-green-800 text-lg">Key Points</h3>
          </div>
          <div className="space-y-3">
            {data.keyPoints.map((point: string, index: number) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-green-800 leading-relaxed">{point}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Practical Tips */}
      {data.practicalTips && data.practicalTips.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-6 border border-amber-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Lightbulb className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="font-semibold text-amber-800 text-lg">Practical Tips</h3>
          </div>
          <div className="space-y-3">
            {data.practicalTips.map((tip: string, index: number) => (
              <div key={index} className="flex items-start gap-3">
                <span className="text-amber-500 text-lg">💡</span>
                <p className="text-amber-800 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      {data.nextSteps && data.nextSteps.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ArrowRight className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-purple-800 text-lg">What's Next?</h3>
          </div>
          <div className="space-y-3">
            {data.nextSteps.map((step: string, index: number) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-purple-800 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StructuredExplanationResponse({ data }: any) {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Title and Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BookOpen className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">{data.title}</h2>
        </div>
        <p className="text-gray-700 leading-relaxed text-base">{data.overview}</p>
      </div>

      {/* Sections */}
      {data.sections?.map((section: any, index: number) => (
        <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-3 text-lg">
            <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
              {index + 1}
            </span>
            {section.heading}
          </h3>
          <p className="text-gray-700 leading-relaxed mb-4">{section.content}</p>

          {section.examples && section.examples.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <p className="text-sm font-medium text-gray-600 mb-3">Examples:</p>
              <div className="space-y-2">
                {section.examples.map((example: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="text-blue-500 font-bold">•</span>
                    <span className="text-gray-700">{example}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Analogy */}
      {data.analogy && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Lightbulb className="h-5 w-5 text-orange-600" />
            </div>
            <h3 className="font-semibold text-orange-800 text-lg">Think of it this way</h3>
          </div>
          <p className="text-orange-800 leading-relaxed">{data.analogy}</p>
        </div>
      )}

      {/* Key Takeaways */}
      {data.keyTakeaways && data.keyTakeaways.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-green-800 text-lg">Key Takeaways</h3>
          </div>
          <div className="space-y-3">
            {data.keyTakeaways.map((takeaway: string, index: number) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-green-800 leading-relaxed">{takeaway}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Common Mistakes */}
      {data.commonMistakes && data.commonMistakes.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6 border border-red-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <Zap className="h-5 w-5 text-red-600" />
            </div>
            <h3 className="font-semibold text-red-800 text-lg">Common Mistakes to Avoid</h3>
          </div>
          <div className="space-y-3">
            {data.commonMistakes.map((mistake: string, index: number) => (
              <div key={index} className="flex items-start gap-3">
                <span className="text-red-500 text-lg">⚠️</span>
                <p className="text-red-800 leading-relaxed">{mistake}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StepByStepResponse({ data, copyToClipboard, copiedIndex }: any) {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Title and Introduction */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Target className="h-6 w-6 text-indigo-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">{data.title}</h2>
        </div>
        <p className="text-gray-700 leading-relaxed text-base">{data.introduction}</p>
      </div>

      {/* Prerequisites */}
      {data.prerequisites && data.prerequisites.length > 0 && (
        <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
          <h3 className="font-semibold text-yellow-800 mb-4 text-lg">Prerequisites</h3>
          <div className="space-y-2">
            {data.prerequisites.map((prereq: string, index: number) => (
              <div key={index} className="flex items-start gap-3">
                <span className="text-yellow-600 text-lg">📋</span>
                <p className="text-yellow-800">{prereq}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Steps */}
      {data.steps?.map((step: any, index: number) => (
        <div key={index} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800 flex items-center gap-3 text-lg">
              <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                {step.stepNumber}
              </span>
              {step.title}
            </h3>
          </div>

          <div className="p-6">
            <p className="text-gray-700 leading-relaxed mb-4">{step.description}</p>

            {step.code && (
              <div className="mb-4">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-900 text-white rounded-t-lg">
                  <span className="text-sm font-medium">Code Example</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-white hover:bg-gray-700"
                    onClick={() => copyToClipboard(step.code, index)}
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
                <div className="p-4 bg-gray-50 rounded-b-lg">
                  <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                    {step.code}
                  </pre>
                </div>
              </div>
            )}

            {step.tips && step.tips.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm font-medium text-blue-800 mb-3">💡 Tips for this step:</p>
                <div className="space-y-2">
                  {step.tips.map((tip: string, tipIndex: number) => (
                    <div key={tipIndex} className="flex items-start gap-2">
                      <span className="text-blue-500">•</span>
                      <span className="text-blue-700 text-sm">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Summary */}
      {data.summary && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-green-800 text-lg">What You've Accomplished</h3>
          </div>
          <p className="text-green-800 leading-relaxed">{data.summary}</p>
        </div>
      )}
    </div>
  )
}

function PracticeExerciseResponse({ data, copyToClipboard, copiedIndex }: any) {
  const [showSolution, setShowSolution] = useState(false)

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Title and Objective */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Code2 className="h-6 w-6 text-purple-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">{data.title}</h2>
          {data.difficulty && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                data.difficulty === "Beginner"
                  ? "bg-green-100 text-green-800"
                  : data.difficulty === "Intermediate"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
              }`}
            >
              {data.difficulty}
            </span>
          )}
        </div>
        <p className="text-gray-700 leading-relaxed text-base">{data.objective}</p>
      </div>

      {/* Problem Statement */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4 text-lg">🎯 Problem</h3>
        <p className="text-gray-700 leading-relaxed mb-4">{data.problem}</p>

        {data.requirements && data.requirements.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="font-medium text-blue-800 mb-3">Requirements:</p>
            <div className="space-y-2">
              {data.requirements.map((req: string, index: number) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-blue-500">✓</span>
                  <span className="text-blue-700">{req}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sample Input/Output */}
      {(data.sampleInput || data.expectedOutput) && (
        <div className="grid md:grid-cols-2 gap-4">
          {data.sampleInput && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="font-medium text-gray-800 mb-3">Sample Input:</p>
              <pre className="text-sm font-mono text-gray-700 whitespace-pre-wrap">{data.sampleInput}</pre>
            </div>
          )}
          {data.expectedOutput && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="font-medium text-gray-800 mb-3">Expected Output:</p>
              <pre className="text-sm font-mono text-gray-700 whitespace-pre-wrap">{data.expectedOutput}</pre>
            </div>
          )}
        </div>
      )}

      {/* Hints */}
      {data.hints && data.hints.length > 0 && (
        <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
          <h3 className="font-semibold text-yellow-800 mb-4 text-lg">💡 Hints</h3>
          <div className="space-y-3">
            {data.hints.map((hint: string, index: number) => (
              <div key={index} className="flex items-start gap-3">
                <span className="text-yellow-600 text-lg">💭</span>
                <p className="text-yellow-800">{hint}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Solution */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <Button
            onClick={() => setShowSolution(!showSolution)}
            className="w-full justify-center"
            variant={showSolution ? "secondary" : "default"}
          >
            {showSolution ? "Hide Solution" : "Show Solution"}
          </Button>
        </div>

        {showSolution && data.solution && (
          <div className="p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-900 text-white rounded-t-lg">
                <span className="text-sm font-medium">Solution</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-white hover:bg-gray-700"
                  onClick={() => copyToClipboard(data.solution.code, 999)}
                >
                  {copiedIndex === 999 ? (
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
              <div className="p-4 bg-gray-50 rounded-b-lg">
                <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                  {data.solution.code}
                </pre>
              </div>
            </div>

            {data.solution.explanation && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="font-medium text-blue-800 mb-3">Explanation:</p>
                <p className="text-blue-700 leading-relaxed">{data.solution.explanation}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Variations */}
      {data.variations && data.variations.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
          <h3 className="font-semibold text-indigo-800 mb-4 text-lg">🚀 Try These Variations</h3>
          <div className="space-y-3">
            {data.variations.map((variation: string, index: number) => (
              <div key={index} className="flex items-start gap-3">
                <span className="text-indigo-600 text-lg">🎯</span>
                <p className="text-indigo-800">{variation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ComparisonResponse({ data }: any) {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-6 border border-cyan-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4">{data.title}</h2>
        <p className="text-gray-700 leading-relaxed">{data.introduction}</p>
      </div>

      {/* Comparison Table */}
      {data.comparisonTable && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-800">Aspect</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-800">Option 1</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-800">Option 2</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.comparisonTable.map((row: any, index: number) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{row.aspect}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{row.option1}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{row.option2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pros and Cons */}
      {data.prosAndCons && (
        <div className="grid md:grid-cols-2 gap-6">
          {Object.entries(data.prosAndCons).map(([key, option]: [string, any]) => (
            <div key={key} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4 text-lg">{option.name}</h3>

              <div className="space-y-4">
                <div>
                  <p className="font-medium text-green-800 mb-3">✅ Pros:</p>
                  <div className="space-y-2">
                    {option.pros.map((pro: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-green-500 font-bold">+</span>
                        <span className="text-green-700 text-sm">{pro}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="font-medium text-red-800 mb-3">❌ Cons:</p>
                  <div className="space-y-2">
                    {option.cons.map((con: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-red-500 font-bold">-</span>
                        <span className="text-red-700 text-sm">{con}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recommendation */}
      {data.recommendation && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-green-800 text-lg">Recommendation</h3>
          </div>
          <p className="text-green-800 leading-relaxed">{data.recommendation}</p>
        </div>
      )}
    </div>
  )
}

function ComprehensiveGuideResponse({ data }: any) {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-6 border border-violet-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-violet-100 rounded-lg">
            <BookOpen className="h-6 w-6 text-violet-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">{data.title}</h2>
        </div>
        <p className="text-gray-700 leading-relaxed">{data.overview}</p>
      </div>

      {/* Learning Objectives */}
      {data.learningObjectives && data.learningObjectives.length > 0 && (
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-4 text-lg">🎯 Learning Objectives</h3>
          <div className="space-y-3">
            {data.learningObjectives.map((objective: string, index: number) => (
              <div key={index} className="flex items-start gap-3">
                <span className="text-blue-600 text-lg">📚</span>
                <p className="text-blue-800">{objective}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sections */}
      {data.sections?.map((section: any, index: number) => (
        <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-3 text-lg">
            <span className="w-8 h-8 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center text-sm font-bold">
              {index + 1}
            </span>
            {section.heading}
          </h3>
          <p className="text-gray-700 leading-relaxed mb-4">{section.content}</p>

          {section.codeExample && (
            <div className="mb-4">
              <pre className="p-4 bg-gray-50 rounded-lg overflow-x-auto border border-gray-200">
                <code className="text-sm font-mono text-gray-800 whitespace-pre-wrap">{section.codeExample}</code>
              </pre>
            </div>
          )}

          {section.practicalApplication && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="font-medium text-green-800 mb-2">🌟 Real-world Application:</p>
              <p className="text-green-700 text-sm">{section.practicalApplication}</p>
            </div>
          )}
        </div>
      ))}

      {/* Quick Reference */}
      {data.quickReference && data.quickReference.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
          <h3 className="font-semibold text-amber-800 mb-4 text-lg">⚡ Quick Reference</h3>
          <div className="space-y-2">
            {data.quickReference.map((item: string, index: number) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-amber-600">•</span>
                <span className="text-amber-800 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function FallbackResponse({ data }: any) {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4">{data.title}</h2>
        <p className="text-gray-700 leading-relaxed mb-4">{data.content}</p>

        {data.suggestions && data.suggestions.length > 0 && (
          <div className="space-y-3">
            <p className="font-medium text-gray-800">Here's how I can help:</p>
            <div className="space-y-2">
              {data.suggestions.map((suggestion: string, index: number) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span className="text-gray-700">{suggestion}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
