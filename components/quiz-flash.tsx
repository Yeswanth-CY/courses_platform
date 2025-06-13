"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle } from "lucide-react"

interface Question {
  id: number
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

interface QuizFlashProps {
  questions: Question[]
  onComplete: (score: number) => void
}

export function QuizFlash({ questions, onComplete }: QuizFlashProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return
    setSelectedAnswer(answerIndex)
  }

  const handleSubmit = () => {
    if (selectedAnswer === null) return

    const isCorrect = selectedAnswer === questions[currentQuestion].correctAnswer
    const newAnswers = [...answers, selectedAnswer]
    setAnswers(newAnswers)

    if (isCorrect) {
      setScore(score + 1)
    }

    setShowResult(true)

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
        setSelectedAnswer(null)
        setShowResult(false)
      } else {
        onComplete(score + (isCorrect ? 1 : 0))
      }
    }, 2000)
  }

  const question = questions[currentQuestion]

  return (
    <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">Quick Quiz</h3>
        <span className="text-sm text-gray-600">
          {currentQuestion + 1} / {questions.length}
        </span>
      </div>

      <div className="bg-white rounded-lg p-4 mb-4">
        <h4 className="font-semibold text-lg mb-4 text-gray-800">{question.question}</h4>

        <div className="space-y-3">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              disabled={showResult}
              className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                selectedAnswer === index
                  ? showResult
                    ? index === question.correctAnswer
                      ? "border-green-500 bg-green-50 text-green-800"
                      : "border-red-500 bg-red-50 text-red-800"
                    : "border-purple-500 bg-purple-50"
                  : showResult && index === question.correctAnswer
                    ? "border-green-500 bg-green-50 text-green-800"
                    : "border-gray-200 hover:border-purple-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{option}</span>
                {showResult &&
                  selectedAnswer === index &&
                  (index === question.correctAnswer ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  ))}
                {showResult && selectedAnswer !== index && index === question.correctAnswer && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
              </div>
            </button>
          ))}
        </div>

        {showResult && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">{question.explanation}</p>
          </div>
        )}
      </div>

      {!showResult && (
        <Button
          onClick={handleSubmit}
          disabled={selectedAnswer === null}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          Submit Answer
        </Button>
      )}
    </div>
  )
}
