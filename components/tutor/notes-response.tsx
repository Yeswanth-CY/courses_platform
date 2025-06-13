"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react"

type NotesResponseProps = {
  data: {
    title: string
    sections: {
      heading: string
      content: string
    }[]
  }
}

export default function NotesResponse({ data }: NotesResponseProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const totalPages = data.sections.length

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-2 flex items-center gap-2">
        <div className="bg-blue-100 p-1 rounded-full">
          <BookOpen className="h-4 w-4 text-blue-600" />
        </div>
        <h3 className="text-sm font-medium text-blue-600">Learning Notes</h3>
        <span className="ml-auto text-sm text-gray-500">
          {currentPage + 1} of {totalPages}
        </span>
      </div>

      <div className="border rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">{data.title}</h2>

          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="font-medium text-gray-700 mb-2">{data.sections[currentPage].heading}</h3>
            <p className="text-gray-600">{data.sections[currentPage].content}</p>
          </motion.div>
        </div>

        <div className="flex border-t p-3 bg-white">
          <button
            onClick={prevPage}
            disabled={currentPage === 0}
            className="flex items-center gap-1 px-3 py-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <div className="flex-1 flex justify-center">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`mx-1 w-2 h-2 rounded-full ${i === currentPage ? "bg-blue-600" : "bg-gray-300"}`}
                aria-label={`Go to page ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={nextPage}
            disabled={currentPage === totalPages - 1}
            className="flex items-center gap-1 px-3 py-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
