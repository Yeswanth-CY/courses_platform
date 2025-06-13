"use client"

import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface Note {
  id: number
  title: string
  content: string
  illustration: string
}

interface NotesSlidesProps {
  notes: Note[]
}

export function NotesSlides({ notes }: NotesSlidesProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  if (!notes || !Array.isArray(notes) || notes.length === 0) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-800">Learning Notes</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-600">No notes available for this content.</p>
        </div>
      </div>
    )
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % notes.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + notes.length) % notes.length)
  }

  const currentNote = notes[currentSlide]

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-800">Learning Notes</h3>
        </div>
        <div className="text-sm text-gray-600">
          {currentSlide + 1} of {notes.length}
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm min-h-[200px]">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl" role="img" aria-label="illustration">
            {typeof currentNote.illustration === "string" ? currentNote.illustration : "📚"}
          </span>
          <h4 className="text-xl font-bold text-gray-800">
            {typeof currentNote.title === "string" ? currentNote.title : `Note ${currentSlide + 1}`}
          </h4>
        </div>

        <div className="prose prose-gray max-w-none">
          <p className="text-gray-700 leading-relaxed">
            {typeof currentNote.content === "string" ? currentNote.content : "No content available"}
          </p>
        </div>
      </div>

      {notes.length > 1 && (
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={prevSlide}
            disabled={notes.length <= 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            {notes.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentSlide ? "bg-blue-600" : "bg-gray-300"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={nextSlide}
            disabled={notes.length <= 1}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
