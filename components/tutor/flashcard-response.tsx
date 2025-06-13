"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { RotateCw } from "lucide-react"

type FlashcardProps = {
  data: {
    term: string
    definition: string
    examples: string[]
  }
}

export default function FlashcardResponse({ data }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-2 flex items-center gap-2">
        <div className="bg-purple-100 p-1 rounded-full">
          <RotateCw className="h-4 w-4 text-purple-600" />
        </div>
        <h3 className="text-sm font-medium text-purple-600">Flashcard</h3>
      </div>

      <div className="relative w-full h-64 cursor-pointer perspective-1000" onClick={() => setIsFlipped(!isFlipped)}>
        <motion.div
          className="w-full h-full relative preserve-3d transition-all duration-500"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
        >
          {/* Front side */}
          <div className="absolute w-full h-full backface-hidden border rounded-xl p-6 flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50">
            <p className="text-sm text-gray-500 uppercase tracking-wider mb-2">TERM</p>
            <h2 className="text-2xl font-bold text-center text-gray-800">{data.term}</h2>
            <p className="mt-4 text-sm text-center text-gray-500">Click to reveal definition</p>
          </div>

          {/* Back side */}
          <div className="absolute w-full h-full backface-hidden border rounded-xl p-6 flex flex-col bg-gradient-to-br from-indigo-50 to-purple-50 rotate-y-180">
            <p className="text-sm text-gray-500 uppercase tracking-wider mb-2">DEFINITION</p>
            <p className="text-gray-800">{data.definition}</p>

            {data.examples && data.examples.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">EXAMPLE</p>
                <p className="text-gray-700 italic">{data.examples[0]}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <p className="text-center text-sm text-gray-500 mt-2">Tap card to flip</p>
    </div>
  )
}
