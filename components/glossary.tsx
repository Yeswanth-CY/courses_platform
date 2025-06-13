"use client"

import { BookOpen, Search } from "lucide-react"
import { useState } from "react"

interface GlossaryTerm {
  term: string
  definition: string
}

interface GlossaryProps {
  terms: GlossaryTerm[]
}

export function Glossary({ terms }: GlossaryProps) {
  const [searchTerm, setSearchTerm] = useState("")

  if (!terms || !Array.isArray(terms) || terms.length === 0) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-amber-600" />
          <h3 className="text-lg font-bold text-gray-800">Glossary</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-600">No glossary terms available for this content.</p>
        </div>
      </div>
    )
  }

  const filteredTerms = terms.filter((item) => {
    if (!item || typeof item !== "object") return false
    const term = typeof item.term === "string" ? item.term : ""
    const definition = typeof item.definition === "string" ? item.definition : ""
    return (
      term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      definition.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-amber-600" />
        <h3 className="text-lg font-bold text-gray-800">Glossary</h3>
      </div>

      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search terms..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm max-h-96 overflow-y-auto">
        {filteredTerms.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredTerms.map((item, index) => (
              <div key={index} className="p-4">
                <dt className="font-semibold text-gray-800 mb-2">
                  {typeof item.term === "string" ? item.term : `Term ${index + 1}`}
                </dt>
                <dd className="text-gray-700 text-sm leading-relaxed">
                  {typeof item.definition === "string" ? item.definition : "No definition available"}
                </dd>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-600">No terms found matching "{searchTerm}"</p>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600 text-center">
        {filteredTerms.length} of {terms.length} terms
      </div>
    </div>
  )
}
