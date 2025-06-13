import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

interface LearningContent {
  notes: Array<{
    id: number
    title: string
    content: string
    illustration: string
  }>
  simpleExplanation: {
    title: string
    explanation: string
    keyPoints: string[]
  }
  codeExamples?: Array<{
    id: number
    title: string
    description: string
    code: string
    output?: string
    explanation: string
    language?: string
  }>
  practicalExamples?: Array<{
    id: number
    scenario: string
    problem: string
    solution: string
    outcome: string
  }>
  questions: Array<{
    id: number
    question: string
    options: string[]
    correctAnswer: number
    explanation: string
  }>
  flashcards: Array<{
    id: number
    term: string
    definition: string
  }>
  glossary: Array<{
    term: string
    definition: string
  }>
  analogy: string
  challengePrompt: string
  detectedLanguage?: string
  contentType: "programming" | "general"
}

// Rate limiting state
let lastRequestTime = 0
let requestCount = 0
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const MAX_REQUESTS_PER_MINUTE = 12 // Conservative limit

async function rateLimitedRequest(requestFn: () => Promise<any>): Promise<any> {
  const now = Date.now()

  // Reset counter if window has passed
  if (now - lastRequestTime > RATE_LIMIT_WINDOW) {
    requestCount = 0
    lastRequestTime = now
  }

  // Check if we're at the limit
  if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
    const waitTime = RATE_LIMIT_WINDOW - (now - lastRequestTime)
    console.log(`Rate limit reached, waiting ${waitTime}ms`)
    await new Promise((resolve) => setTimeout(resolve, waitTime))
    requestCount = 0
    lastRequestTime = Date.now()
  }

  requestCount++

  try {
    return await requestFn()
  } catch (error: any) {
    // Handle quota exceeded error
    if (error.message?.includes("429") || error.message?.includes("quota")) {
      console.log("Quota exceeded, waiting 20 seconds before retry...")
      await new Promise((resolve) => setTimeout(resolve, 20000))

      // Reset counters and try once more
      requestCount = 0
      lastRequestTime = Date.now()
      return await requestFn()
    }
    throw error
  }
}

export async function generateVideoLearningContent(
  videoTitle: string,
  videoTopic: string,
  videoSummary: string,
  moduleTitle: string,
  courseTitle: string,
  detectionContext?: any,
): Promise<LearningContent> {
  console.log(`Generating AI content for: ${videoTitle} from ${courseTitle}`)

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Determine if this is programming content
    const isProgramming = detectProgrammingContent(videoTitle, videoTopic, courseTitle, moduleTitle)
    const programmingLanguage = detectProgrammingLanguage(videoTitle, videoTopic, courseTitle, moduleTitle)

    // Create a comprehensive single prompt instead of multiple parallel calls
    const comprehensivePrompt = `
You are an expert educational content creator. Generate comprehensive learning materials for this specific video:

VIDEO TITLE: "${videoTitle}"
VIDEO TOPIC: "${videoTopic}"
COURSE: "${courseTitle}"
MODULE: "${moduleTitle}"
SUMMARY: "${videoSummary}"

Create educational content that is:
1. Specifically tailored to "${videoTitle}"
2. Contextual to the course "${courseTitle}"
3. Educational and engaging
4. Practical and actionable

${
  isProgramming
    ? `
This is programming content about ${programmingLanguage || "programming"}. Include:
- Relevant code examples with proper syntax
- Programming concepts and terminology
- Best practices and common patterns
- Practical coding scenarios
`
    : `
This is general educational content. Include:
- Clear explanations of concepts
- Real-world applications
- Practical examples
- Learning objectives
`
}

Generate a JSON response with this exact structure:

{
  "notes": [
    // 5-6 detailed learning notes specifically about "${videoTitle}"
    {
      "id": 1,
      "title": "Specific concept from ${videoTitle}",
      "content": "Detailed explanation with specific examples, techniques, or principles from the video. Include technical details and practical applications.",
      "illustration": "🎯"
    },
    {
      "id": 2,
      "title": "Core principles in ${videoTitle}",
      "content": "Deep dive into the fundamental principles covered in this video. Explain how these concepts work and why they're important.",
      "illustration": "🧠"
    },
    {
      "id": 3,
      "title": "Advanced techniques for ${videoTitle}",
      "content": "More complex aspects of ${videoTitle}. Include advanced methods, optimization techniques, and professional practices.",
      "illustration": "🔧"
    },
    {
      "id": 4,
      "title": "Best practices and patterns",
      "content": "Industry-standard approaches for ${videoTitle}. Include common patterns, design principles, and professional guidelines.",
      "illustration": "⭐"
    },
    {
      "id": 5,
      "title": "Real-world applications",
      "content": "How ${videoTitle} concepts are used in actual projects. Include case studies, examples, and practical implementations.",
      "illustration": "✅"
    }
  ],
  "flashcards": [
    // 8-10 topic-specific flashcards with technical terms from "${videoTitle}"
    {
      "id": 1,
      "term": "Key technical term from ${videoTitle}",
      "definition": "Precise definition of this term as it relates to ${videoTitle} and ${courseTitle}"
    },
    {
      "id": 2,
      "term": "Important concept from ${videoTitle}",
      "definition": "Clear explanation of this concept with context from the video"
    },
    {
      "id": 3,
      "term": "Technical method from ${videoTitle}",
      "definition": "Definition of this method and how it's used in ${videoTitle}"
    },
    {
      "id": 4,
      "term": "Framework/Tool from ${videoTitle}",
      "definition": "Explanation of this framework or tool as covered in the video"
    },
    {
      "id": 5,
      "term": "Design pattern from ${videoTitle}",
      "definition": "Description of this pattern and its application in ${videoTitle}"
    },
    {
      "id": 6,
      "term": "Algorithm/Process from ${videoTitle}",
      "definition": "Step-by-step explanation of this algorithm or process"
    },
    {
      "id": 7,
      "term": "Best practice from ${videoTitle}",
      "definition": "Professional guideline or best practice as taught in the video"
    },
    {
      "id": 8,
      "term": "Advanced concept from ${videoTitle}",
      "definition": "Complex concept that builds on the fundamentals in ${videoTitle}"
    }
  ],
  "glossary": [
    // 8-12 technical terms specific to "${videoTitle}"
    {
      "term": "Technical term 1 from ${videoTitle}",
      "definition": "Comprehensive technical definition with context from ${courseTitle}"
    },
    {
      "term": "Technical term 2 from ${videoTitle}",
      "definition": "Detailed explanation of this term as it applies to ${videoTitle}"
    },
    {
      "term": "Framework/Library from ${videoTitle}",
      "definition": "Technical description of this framework or library"
    },
    {
      "term": "Methodology from ${videoTitle}",
      "definition": "Systematic approach or methodology covered in the video"
    },
    {
      "term": "Architecture pattern from ${videoTitle}",
      "definition": "Structural design pattern or architecture discussed in ${videoTitle}"
    },
    {
      "term": "Performance concept from ${videoTitle}",
      "definition": "Performance-related concept or optimization technique"
    },
    {
      "term": "Security aspect from ${videoTitle}",
      "definition": "Security consideration or practice mentioned in the video"
    },
    {
      "term": "Industry standard from ${videoTitle}",
      "definition": "Professional standard or convention covered in ${videoTitle}"
    }
  ],
  "simpleExplanation": {
    "title": "Understanding ${videoTitle}",
    "explanation": "Clear, comprehensive explanation of what ${videoTitle} teaches and why it's important in ${courseTitle}",
    "keyPoints": [
      "Specific learning point from ${videoTitle}",
      "Another key concept from this video",
      "Practical application of ${videoTitle} content",
      "How this connects to ${courseTitle}"
    ]
  },
  ${
    isProgramming
      ? `
  "codeExamples": [
    {
      "id": 1,
      "title": "Code example related to ${videoTitle}",
      "description": "What this code demonstrates from the video",
      "code": "// Actual ${programmingLanguage || "code"} example\\n// Related to ${videoTitle}\\n// Include proper syntax and comments",
      "output": "Expected output with explanation",
      "explanation": "How this relates to ${videoTitle} concepts",
      "language": "${programmingLanguage || "javascript"}"
    }
  ],
  `
      : ""
  }
  "practicalExamples": [
    {
      "id": 1,
      "scenario": "Real-world scenario where ${videoTitle} concepts apply",
      "problem": "Specific problem that ${videoTitle} helps solve",
      "solution": "How to apply ${videoTitle} concepts to solve it",
      "outcome": "Expected results from applying ${videoTitle} knowledge"
    }
  ],
  "questions": [
    {
      "id": 1,
      "question": "Specific technical question about ${videoTitle} content",
      "options": ["Correct answer about ${videoTitle}", "Incorrect technical option", "Another wrong answer", "Unrelated option"],
      "correctAnswer": 0,
      "explanation": "Why this is correct based on ${videoTitle} content"
    },
    {
      "id": 2,
      "question": "Advanced question testing understanding of ${videoTitle}",
      "options": ["Wrong answer", "Correct technical answer about the video", "Incorrect option", "Wrong choice"],
      "correctAnswer": 1,
      "explanation": "Detailed explanation based on ${videoTitle} concepts"
    }
  ],
  "analogy": "Creative, relatable analogy that explains ${videoTitle} concepts in simple terms",
  "challengePrompt": "Practical, hands-on challenge that applies what was learned in ${videoTitle}",
  "detectedLanguage": "${programmingLanguage || "general"}",
  "contentType": "${isProgramming ? "programming" : "general"}"
}

IMPORTANT: Make all content highly specific to "${videoTitle}" and "${courseTitle}". Avoid generic content. Include actual technical terms, concepts, and methods that would be covered in this specific video.

Return only valid JSON.`

    // Use rate-limited request
    const result = await rateLimitedRequest(async () => {
      return await model.generateContent(comprehensivePrompt)
    })

    const response = await result.response
    let text = response.text().trim()

    // Clean and parse the JSON
    text = cleanJsonResponse(text)

    try {
      const content = JSON.parse(text)
      console.log(`Successfully generated AI content for: ${videoTitle}`)

      // Validate and enhance the content
      return validateAndEnhanceContent(content, videoTitle, courseTitle, isProgramming)
    } catch (parseError) {
      console.error("JSON parsing failed, generating fallback content")
      return generateContextualFallback(
        videoTitle,
        videoTopic,
        courseTitle,
        moduleTitle,
        isProgramming,
        programmingLanguage,
      )
    }
  } catch (error) {
    console.error("Error generating content:", error)

    // If it's a quota error, return enhanced fallback
    if (error instanceof Error && (error.message.includes("429") || error.message.includes("quota"))) {
      console.log("Quota exceeded, returning enhanced fallback content")
      return generateEnhancedFallback(
        videoTitle,
        videoTopic,
        courseTitle,
        moduleTitle,
        isProgramming,
        programmingLanguage,
      )
    }

    return generateContextualFallback(videoTitle, videoTopic, courseTitle, moduleTitle, false, null)
  }
}

function detectProgrammingContent(
  videoTitle: string,
  videoTopic: string,
  courseTitle: string,
  moduleTitle: string,
): boolean {
  const programmingKeywords = [
    "python",
    "javascript",
    "java",
    "c++",
    "c#",
    "ruby",
    "go",
    "rust",
    "php",
    "typescript",
    "programming",
    "coding",
    "development",
    "software",
    "algorithm",
    "data structure",
    "function",
    "variable",
    "loop",
    "array",
    "object",
    "class",
    "method",
    "api",
    "framework",
    "library",
    "syntax",
    "debugging",
    "testing",
    "html",
    "css",
    "react",
    "node",
    "express",
    "django",
    "flask",
    "spring",
    "angular",
    "vue",
    "database",
    "sql",
    "mongodb",
    "git",
    "docker",
    "kubernetes",
    "aws",
    "cloud",
    "devops",
  ]

  const allText = `${videoTitle} ${videoTopic} ${courseTitle} ${moduleTitle}`.toLowerCase()
  return programmingKeywords.some((keyword) => allText.includes(keyword))
}

function detectProgrammingLanguage(
  videoTitle: string,
  videoTopic: string,
  courseTitle: string,
  moduleTitle: string,
): string | null {
  const languages = {
    python: ["python", "py", "django", "flask", "pandas", "numpy", "fastapi"],
    javascript: ["javascript", "js", "node", "react", "vue", "angular", "npm", "express"],
    java: ["java", "spring", "maven", "gradle", "springboot"],
    typescript: ["typescript", "ts", "angular", "nest"],
    "c++": ["c++", "cpp"],
    "c#": ["c#", "csharp", ".net", "dotnet", "asp.net"],
    php: ["php", "laravel", "symfony", "wordpress"],
    ruby: ["ruby", "rails", "gem"],
    go: ["golang", "go"],
    rust: ["rust"],
    html: ["html", "html5", "markup"],
    css: ["css", "css3", "sass", "scss", "tailwind"],
    sql: ["sql", "mysql", "postgresql", "sqlite", "database"],
  }

  const allText = `${videoTitle} ${videoTopic} ${courseTitle} ${moduleTitle}`.toLowerCase()

  for (const [language, keywords] of Object.entries(languages)) {
    if (keywords.some((keyword) => allText.includes(keyword))) {
      return language
    }
  }

  return null
}

function cleanJsonResponse(text: string): string {
  // Remove markdown formatting
  text = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "")

  // Find JSON boundaries
  const jsonStart = text.indexOf("{")
  const jsonEnd = text.lastIndexOf("}")

  if (jsonStart !== -1 && jsonEnd !== -1) {
    text = text.substring(jsonStart, jsonEnd + 1)
  }

  // Clean up common issues
  return text
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/,(\s*[}\]])/g, "$1")
    .trim()
}

function validateAndEnhanceContent(
  content: any,
  videoTitle: string,
  courseTitle: string,
  isProgramming: boolean,
): LearningContent {
  // Ensure all arrays exist and have proper structure
  if (!Array.isArray(content.notes) || content.notes.length < 3) {
    content.notes = generateContextualNotes(videoTitle, courseTitle)
  }

  if (!content.simpleExplanation || typeof content.simpleExplanation !== "object") {
    content.simpleExplanation = {
      title: `Understanding ${videoTitle}`,
      explanation: `This video covers important concepts about ${videoTitle} as part of ${courseTitle}.`,
      keyPoints: [
        `Learn the fundamentals covered in ${videoTitle}`,
        `Understand practical applications`,
        `Apply knowledge from ${courseTitle}`,
      ],
    }
  }

  if (!Array.isArray(content.questions) || content.questions.length < 2) {
    content.questions = generateContextualQuestions(videoTitle, courseTitle)
  }

  if (!Array.isArray(content.flashcards) || content.flashcards.length < 3) {
    content.flashcards = generateContextualFlashcards(videoTitle, courseTitle)
  }

  if (!Array.isArray(content.glossary) || content.glossary.length < 3) {
    content.glossary = generateContextualGlossary(videoTitle, courseTitle)
  }

  if (!content.analogy) {
    content.analogy = `Understanding ${videoTitle} is like learning a new skill - you start with the basics and build up your knowledge step by step.`
  }

  if (!content.challengePrompt) {
    content.challengePrompt = `Apply what you learned from ${videoTitle} by creating a practical project that demonstrates these concepts.`
  }

  content.contentType = isProgramming ? "programming" : "general"

  return content as LearningContent
}

function generateEnhancedFallback(
  videoTitle: string,
  videoTopic: string,
  courseTitle: string,
  moduleTitle: string,
  isProgramming: boolean,
  programmingLanguage: string | null,
): LearningContent {
  const topics = extractTopics(videoTitle)

  return {
    notes: generateEnhancedNotes(videoTitle, videoTopic, courseTitle, topics),
    simpleExplanation: {
      title: `Understanding ${videoTitle}`,
      explanation: `This video teaches you about ${videoTopic} as part of the ${courseTitle} course. You'll learn practical concepts and applications that you can use in real-world scenarios, focusing on ${topics[0] || videoTitle} and its implementation.`,
      keyPoints: [
        `Master ${topics[0] || videoTitle} concepts and principles`,
        `Understand ${topics[1] || videoTopic} implementation techniques`,
        `Apply ${topics[2] || "these skills"} in practical situations`,
        `Build upon previous knowledge from ${moduleTitle}`,
      ],
    },
    codeExamples: isProgramming
      ? [
          {
            id: 1,
            title: `${programmingLanguage || "Programming"} Implementation for ${topics[0] || videoTitle}`,
            description: `Practical code example demonstrating ${topics[0] || videoTitle} concepts from ${videoTitle}`,
            code: generateSampleCode(videoTitle, programmingLanguage, topics),
            output: `// Output demonstrating ${topics[0] || videoTitle} functionality`,
            explanation: `This code example illustrates the main ${topics[0] || videoTitle} concepts taught in ${videoTitle}, showing practical implementation techniques.`,
            language: programmingLanguage || "javascript",
          },
        ]
      : undefined,
    practicalExamples: [
      {
        id: 1,
        scenario: `Real-world application of ${topics[0] || videoTitle} in ${courseTitle}`,
        problem: `Common challenge: How to implement ${topics[1] || videoTopic} effectively`,
        solution: `Step-by-step approach using ${topics[0] || videoTitle} principles from ${videoTitle}`,
        outcome: `Successful implementation of ${topics[2] || videoTitle} concepts with improved efficiency`,
      },
    ],
    questions: generateEnhancedQuestions(videoTitle, videoTopic, courseTitle, topics),
    flashcards: generateEnhancedFlashcards(videoTitle, videoTopic, courseTitle, topics, isProgramming),
    glossary: generateEnhancedGlossary(videoTitle, videoTopic, courseTitle, topics, isProgramming),
    analogy: generateContextualAnalogy(videoTitle, topics),
    challengePrompt: `Create a ${isProgramming ? "coding" : "practical"} project that demonstrates your understanding of ${topics[0] || videoTitle}. Implement ${topics[1] || videoTopic} concepts and apply the techniques you've learned from ${videoTitle} to solve a real-world problem.`,
    detectedLanguage: programmingLanguage || "general",
    contentType: isProgramming ? "programming" : "general",
  }
}

function generateSampleCode(videoTitle: string, language: string | null, topics: string[]): string {
  const lang = language || "javascript"
  const mainTopic = topics[0] || videoTitle

  switch (lang.toLowerCase()) {
    case "python":
      return `# ${mainTopic} implementation from ${videoTitle}
def ${mainTopic.toLowerCase().replace(/\s+/g, "_")}():
    """
    Implementation of ${mainTopic} concepts
    """
    # Core logic for ${mainTopic}
    result = process_${topics[1]?.toLowerCase().replace(/\s+/g, "_") || "data"}()
    return result

# Example usage
if __name__ == "__main__":
    output = ${mainTopic.toLowerCase().replace(/\s+/g, "_")}()
    print(f"Result: {output}")`

    case "java":
      return `// ${mainTopic} implementation from ${videoTitle}
public class ${mainTopic.replace(/\s+/g, "")} {
    
    public static void main(String[] args) {
        ${mainTopic.replace(/\s+/g, "")} example = new ${mainTopic.replace(/\s+/g, "")}();
        example.process();
    }
    
    public void process() {
        // Core ${mainTopic} logic
        System.out.println("Processing ${mainTopic}");
    }
}`

    default:
      return `// ${mainTopic} implementation from ${videoTitle}
function ${mainTopic.toLowerCase().replace(/\s+/g, "")}() {
    // Core logic for ${mainTopic}
    const result = process${topics[1]?.replace(/\s+/g, "") || "Data"}();
    return result;
}

// Example usage
const output = ${mainTopic.toLowerCase().replace(/\s+/g, "")}();
console.log('Result:', output);`
  }
}

function generateEnhancedNotes(videoTitle: string, videoTopic: string, courseTitle: string, topics: string[]) {
  return [
    {
      id: 1,
      title: `Introduction to ${topics[0] || videoTitle}`,
      content: `This section introduces ${topics[0] || videoTitle} and explains its critical role in ${courseTitle}. You'll learn the fundamental concepts, understand the problem it solves, and see why ${topics[0] || videoTitle} is essential for ${videoTopic}. Key principles include proper implementation, best practices, and common use cases.`,
      illustration: "🎯",
    },
    {
      id: 2,
      title: `Core Concepts of ${topics[1] || videoTopic}`,
      content: `Explore the main ideas and principles of ${topics[1] || videoTopic} as covered in ${videoTitle}. This includes detailed explanations of the underlying mechanisms, technical specifications, and how ${topics[1] || videoTopic} integrates with other components in ${courseTitle}. Learn about data flow, processing methods, and optimization techniques.`,
      illustration: "🧠",
    },
    {
      id: 3,
      title: `Advanced ${topics[2] || "Implementation"} Techniques`,
      content: `Discover advanced techniques for ${topics[2] || "implementing"} ${videoTitle} concepts. This section covers performance optimization, scalability considerations, error handling, and professional-grade implementations. Learn industry best practices and how to avoid common pitfalls.`,
      illustration: "🔧",
    },
    {
      id: 4,
      title: `Best Practices for ${topics[0] || videoTitle}`,
      content: `Learn industry-standard best practices for ${topics[0] || videoTitle} development. This includes code organization, testing strategies, documentation standards, and maintenance procedures. Understand how professionals approach ${videoTopic} in real-world projects and enterprise environments.`,
      illustration: "⭐",
    },
    {
      id: 5,
      title: `Real-World Applications and Case Studies`,
      content: `See how ${videoTitle} concepts are applied in actual industry projects. This section includes case studies, practical examples, and demonstrations of ${topics[0] || videoTitle} in production environments. Learn from real implementations and understand the business value of these techniques.`,
      illustration: "✅",
    },
  ]
}

function generateEnhancedFlashcards(
  videoTitle: string,
  videoTopic: string,
  courseTitle: string,
  topics: string[],
  isProgramming: boolean,
) {
  const cards = [
    {
      id: 1,
      term: topics[0] || videoTitle,
      definition: `A fundamental concept in ${courseTitle} that ${topics[1] ? "enables " + topics[1] : "solves specific problems"}. Essential for understanding ${videoTopic} and implementing professional-grade solutions.`,
    },
    {
      id: 2,
      term: `${topics[1] || videoTopic} Implementation`,
      definition: `The process of applying ${topics[0] || videoTitle} concepts to create functional solutions in ${courseTitle}. Involves ${topics[2] || "specific techniques"} and follows industry best practices.`,
    },
    {
      id: 3,
      term: `${topics[2] || videoTitle} Architecture`,
      definition: `The structural design and organization of ${topics[0] || videoTitle} systems in ${courseTitle}. Defines component relationships, data flow, and system interactions.`,
    },
    {
      id: 4,
      term: `${topics[0] || videoTitle} Best Practices`,
      definition: `Professional guidelines and recommended approaches for working with ${topics[0] || videoTitle} in ${courseTitle}. Ensures maintainability, performance, and scalability.`,
    },
    {
      id: 5,
      term: `${topics[1] || videoTopic} Optimization`,
      definition: `Techniques to improve the performance and efficiency of ${topics[0] || videoTitle} implementations. Includes algorithm optimization, resource management, and performance tuning.`,
    },
  ]

  if (isProgramming) {
    cards.push(
      {
        id: 6,
        term: `${topics[0] || videoTitle} Syntax`,
        definition: `The specific language constructs and code patterns used to implement ${topics[0] || videoTitle} in programming. Includes proper formatting, naming conventions, and structure.`,
      },
      {
        id: 7,
        term: `${topics[1] || videoTopic} Framework`,
        definition: `A structured system that provides tools and libraries for implementing ${topics[0] || videoTitle} concepts efficiently. Standardizes development practices and reduces complexity.`,
      },
    )
  }

  return cards
}

function generateEnhancedGlossary(
  videoTitle: string,
  videoTopic: string,
  courseTitle: string,
  topics: string[],
  isProgramming: boolean,
) {
  const glossary = [
    {
      term: topics[0] || videoTitle,
      definition: `A core concept in ${courseTitle} that provides ${topics[1] ? "solutions for " + topics[1] : "essential functionality"}. Fundamental to understanding ${videoTopic} and building professional applications.`,
    },
    {
      term: `${topics[0] || videoTitle} Framework`,
      definition: `A structured system that implements ${topics[0] || videoTitle} concepts with standardized methods, tools, and best practices for efficient development in ${courseTitle}.`,
    },
    {
      term: `${topics[1] || videoTopic} Pattern`,
      definition: `A reusable solution template for common problems encountered when implementing ${topics[0] || videoTitle}. Follows established industry best practices and design principles.`,
    },
    {
      term: `${topics[2] || videoTitle} Architecture`,
      definition: `The high-level structural design of ${topics[0] || videoTitle} systems, defining component organization, interaction patterns, and system boundaries in ${courseTitle} applications.`,
    },
    {
      term: `${topics[0] || videoTitle} Methodology`,
      definition: `A systematic approach to implementing and managing ${topics[0] || videoTitle} in ${courseTitle} projects, including processes, techniques, and quality standards.`,
    },
    {
      term: `${topics[1] || videoTopic} Optimization`,
      definition: `The process of improving ${topics[0] || videoTitle} implementations for better performance, efficiency, scalability, or resource utilization in ${courseTitle} systems.`,
    },
  ]

  if (isProgramming) {
    glossary.push(
      {
        term: `${topics[0] || videoTitle} API`,
        definition: `Application Programming Interface that provides standardized methods for interacting with ${topics[0] || videoTitle} functionality in ${courseTitle} applications.`,
      },
      {
        term: `${topics[1] || videoTopic} Library`,
        definition: `A collection of pre-written code modules that implement ${topics[0] || videoTitle} functionality, providing reusable components for ${courseTitle} development.`,
      },
    )
  }

  return glossary
}

function generateEnhancedQuestions(videoTitle: string, videoTopic: string, courseTitle: string, topics: string[]) {
  return [
    {
      id: 1,
      question: `What is the primary purpose of ${topics[0] || videoTitle} in ${courseTitle}?`,
      options: [
        `To ${topics[1] ? "implement " + topics[1] : "solve specific technical problems"} efficiently`,
        `It's unrelated to ${courseTitle}`,
        `Only for theoretical understanding`,
        `Just for basic functionality`,
      ],
      correctAnswer: 0,
      explanation: `${topics[0] || videoTitle} is primarily used to ${topics[1] ? "implement " + topics[1] : "solve specific technical problems"} in ${courseTitle}, making it essential for professional development.`,
    },
    {
      id: 2,
      question: `Which best describes the relationship between ${topics[0] || videoTitle} and ${topics[1] || videoTopic}?`,
      options: [
        `They are completely unrelated concepts`,
        `${topics[0] || videoTitle} is a fundamental component that enables ${topics[1] || videoTopic}`,
        `${topics[1] || videoTopic} is optional when using ${topics[0] || videoTitle}`,
        `They serve the same purpose`,
      ],
      correctAnswer: 1,
      explanation: `${topics[0] || videoTitle} serves as a fundamental component that enables and supports ${topics[1] || videoTopic} implementation in ${courseTitle} applications.`,
    },
  ]
}

function generateContextualAnalogy(videoTitle: string, topics: string[]): string {
  const mainTopic = topics[0] || videoTitle
  const analogies = [
    `Learning ${mainTopic} is like learning to drive a car - you start with understanding the basic controls, then practice coordination, and finally master advanced techniques for different road conditions.`,
    `Understanding ${mainTopic} is like building a house - you need a solid foundation of basic concepts before you can construct the more complex architectural elements.`,
    `Mastering ${mainTopic} is like learning a musical instrument - you begin with simple exercises, gradually build muscle memory, and eventually combine techniques to create complex compositions.`,
    `${mainTopic} is like cooking - you start with basic ingredients (concepts), learn fundamental techniques, and then combine them creatively to produce sophisticated results.`,
  ]

  return analogies[Math.floor(Math.random() * analogies.length)]
}

function generateContextualFallback(
  videoTitle: string,
  videoTopic: string,
  courseTitle: string,
  moduleTitle: string,
  isProgramming: boolean,
  programmingLanguage: string | null,
): LearningContent {
  return generateEnhancedFallback(videoTitle, videoTopic, courseTitle, moduleTitle, isProgramming, programmingLanguage)
}

function extractTopics(title: string): string[] {
  // Extract potential topics from the title
  const words = title.split(/\s+/).filter((word) => word.length > 2)
  const topics: string[] = []

  // Extract noun phrases or significant terms
  if (words.length >= 3) {
    topics.push(words.slice(0, 2).join(" "))
    topics.push(words.slice(-2).join(" "))
    if (words.length >= 5) {
      topics.push(words.slice(2, 4).join(" "))
    } else {
      topics.push(words[Math.floor(words.length / 2)])
    }
  } else if (words.length === 2) {
    topics.push(words[0])
    topics.push(words[1])
    topics.push(words.join(" "))
  } else if (words.length === 1) {
    topics.push(words[0])
    topics.push(`${words[0]} Concepts`)
    topics.push(`Advanced ${words[0]}`)
  }

  return topics.filter((topic) => topic && topic.length > 0)
}

function generateContextualGlossary(videoTitle: string, courseTitle: string) {
  return [
    {
      term: "Term 1",
      definition: `Definition of Term 1 in the context of ${videoTitle} and ${courseTitle}`,
    },
    {
      term: "Term 2",
      definition: `Definition of Term 2 in the context of ${videoTitle} and ${courseTitle}`,
    },
    {
      term: "Term 3",
      definition: `Definition of Term 3 in the context of ${videoTitle} and ${courseTitle}`,
    },
  ]
}

function generateContextualFlashcards(videoTitle: string, courseTitle: string) {
  return [
    {
      term: "Flashcard Term 1",
      definition: `Definition of Flashcard Term 1 in the context of ${videoTitle} and ${courseTitle}`,
    },
    {
      term: "Flashcard Term 2",
      definition: `Definition of Flashcard Term 2 in the context of ${videoTitle} and ${courseTitle}`,
    },
    {
      term: "Flashcard Term 3",
      definition: `Definition of Flashcard Term 3 in the context of ${videoTitle} and ${courseTitle}`,
    },
  ]
}

function generateContextualQuestions(videoTitle: string, courseTitle: string) {
  return [
    {
      id: 1,
      question: `Question 1 about ${videoTitle} in ${courseTitle}`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: 0,
      explanation: `Explanation of why Option A is correct based on ${videoTitle} and ${courseTitle}`,
    },
    {
      id: 2,
      question: `Question 2 about ${videoTitle} in ${courseTitle}`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: 1,
      explanation: `Explanation of why Option B is correct based on ${videoTitle} and ${courseTitle}`,
    },
  ]
}

function generateContextualNotes(videoTitle: string, courseTitle: string) {
  return [
    {
      id: 1,
      title: `Note 1 from ${videoTitle}`,
      content: `Content of Note 1 related to ${videoTitle} and ${courseTitle}`,
      illustration: "🎯",
    },
    {
      id: 2,
      title: `Note 2 from ${videoTitle}`,
      content: `Content of Note 2 related to ${videoTitle} and ${courseTitle}`,
      illustration: "🧠",
    },
    {
      id: 3,
      title: `Note 3 from ${videoTitle}`,
      content: `Content of Note 3 related to ${videoTitle} and ${courseTitle}`,
      illustration: "🔧",
    },
  ]
}

// Keep existing functions for backward compatibility
export async function generateLearningContent(
  prompt: string,
  contentType = "general",
  level = "beginner",
): Promise<LearningContent> {
  return generateVideoLearningContent(prompt, prompt, "", "General Module", "General Course")
}

export async function generateModuleLearningContent(
  moduleTitle: string,
  moduleDescription: string,
  courseTitle: string,
  videos: Array<{ title: string; topic: string }>,
): Promise<LearningContent> {
  if (videos.length === 1) {
    return generateVideoLearningContent(videos[0].title, videos[0].topic, "", moduleTitle, courseTitle)
  }

  const primaryVideo = videos[0]
  return generateVideoLearningContent(
    primaryVideo.title,
    primaryVideo.topic,
    `Module covering: ${videos.map((v) => v.title).join(", ")}`,
    moduleTitle,
    courseTitle,
  )
}

export async function generateVideoSummary(videoTitle: string, courseTitle: string, topic: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `Create a brief, engaging summary for: "${videoTitle}" about "${topic}" from "${courseTitle}". 
    Make it 2-3 sentences, educational, and include 1-2 relevant emojis. Focus on what students will learn.`

    const result = await rateLimitedRequest(async () => {
      return await model.generateContent(prompt)
    })

    const response = await result.response
    const text = response.text().trim()

    if (!text) {
      return `🎓 Learn about ${topic} in this comprehensive video! ${videoTitle} covers essential concepts with practical examples.`
    }

    return text
  } catch (error) {
    console.error("Error generating summary:", error)
    return `🎓 Learn about ${topic} in this comprehensive video! ${videoTitle} covers essential concepts with practical examples.`
  }
}
