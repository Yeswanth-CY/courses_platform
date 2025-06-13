"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RotateCcw, ChevronLeft, ChevronRight, Brain } from "lucide-react"

interface Flashcard {
  id: number
  term: string
  definition: string
}

interface FlashcardSetProps {
  flashcards: Flashcard[]
}

export function FlashcardSet({ flashcards }: FlashcardSetProps) {
  const [currentCard, setCurrentCard] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  if (!flashcards || !Array.isArray(flashcards) || flashcards.length === 0) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-bold text-gray-800">Flashcards</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-600">No flashcards available for this content.</p>
        </div>
      </div>
    )
  }

  const nextCard = () => {
    setCurrentCard((prev) => (prev + 1) % flashcards.length)
    setIsFlipped(false)
  }

  const prevCard = () => {
    setCurrentCard((prev) => (prev - 1 + flashcards.length) % flashcards.length)
    setIsFlipped(false)
  }

  const flipCard = () => {
    setIsFlipped(!isFlipped)
  }

  const currentFlashcard = flashcards[currentCard]

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-bold text-gray-800">Flashcards</h3>
        </div>
        <div className="text-sm text-gray-600">
          {currentCard + 1} of {flashcards.length}
        </div>
      </div>

      <div className="relative">
        <Card
          className="min-h-[200px] cursor-pointer transition-transform hover:scale-105 bg-white shadow-lg"
          onClick={flipCard}
        >
          <CardContent className="p-8 flex items-center justify-center text-center">
            <div className="w-full">
              {!isFlipped ? (
                <div>
                  <div className="text-sm text-gray-500 mb-2 uppercase tracking-wide">Term</div>
                  <h4 className="text-2xl font-bold text-gray-800 mb-4">
                    {typeof currentFlashcard.term === "string" ? currentFlashcard.term : "No term"}
                  </h4>
                  <p className="text-gray-600 text-sm">Click to reveal definition</p>
                </div>
              ) : (
                <div>
                  <div className="text-sm text-gray-500 mb-2 uppercase tracking-wide">Definition</div>
                  <p className="text-lg text-gray-800 leading-relaxed">
                    {typeof currentFlashcard.definition === "string" ? currentFlashcard.definition : "No definition"}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between mt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={prevCard}
          disabled={flashcards.length <= 1}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={flipCard} className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Flip
          </Button>

          <div className="flex gap-2">
            {flashcards.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentCard(index)
                  setIsFlipped(false)
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentCard ? "bg-purple-600" : "bg-gray-300"
                }`}
                aria-label={`Go to flashcard ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={nextCard}
          disabled={flashcards.length <= 1}
          className="flex items-center gap-2"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
