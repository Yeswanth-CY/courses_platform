import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { videoId: string } }) {
  try {
    const { videoId } = params

    // Get video details with module and course info
    const { data: video, error: videoError } = await supabase
      .from("videos")
      .select(`
        *,
        modules!inner(
          *,
          courses!inner(*)
        )
      `)
      .eq("id", videoId)
      .single()

    if (videoError || !video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    // Determine language detection confidence
    let detectionConfidence: "high" | "medium" | "low" | "unknown" = "unknown"
    let detectionSource = "none"

    if (video.programming_language) {
      detectionConfidence = "high"
      detectionSource = "video"
    } else if (video.modules.courses.primary_language) {
      detectionConfidence = "medium"
      detectionSource = "course"
    } else {
      const titleMatch = video.title.match(/(Python|JavaScript|Java|TypeScript)/i)
      if (titleMatch) {
        detectionConfidence = "medium"
        detectionSource = "title"
      } else if (video.summary) {
        const summaryMatch = video.summary.match(/(Python|JavaScript|Java|TypeScript)/i)
        if (summaryMatch) {
          detectionConfidence = "low"
          detectionSource = "summary"
        }
      }
    }

    // Get detected language
    let detectedLanguage = video.programming_language || video.modules.courses.primary_language || null

    if (!detectedLanguage) {
      const titleMatch = video.title.match(/(Python|JavaScript|Java|TypeScript)/i)
      if (titleMatch) {
        detectedLanguage = titleMatch[1]
      } else if (video.summary) {
        const summaryMatch = video.summary.match(/(Python|JavaScript|Java|TypeScript)/i)
        if (summaryMatch) {
          detectedLanguage = summaryMatch[1]
        }
      }
    }

    // Create a demo content response
    const demoContent = {
      detectedLanguage,
      contentType: detectedLanguage ? "programming" : "general",
      contextSource: {
        courseTitle: video.modules.courses.title,
        moduleTitle: video.modules.title,
        videoTitle: video.title,
        detectionConfidence,
        detectionSource,
      },
      notes: [
        {
          id: 1,
          title: `Introduction to ${video.title}`,
          content: `This is a demo note for ${video.title}. The detected language is ${detectedLanguage || "unknown"}.`,
          illustration: "/placeholder.svg?height=200&width=300",
        },
      ],
      simpleExplanation: {
        title: `Understanding ${video.topic || video.title}`,
        explanation: `This is a demo explanation for ${video.title}. The content would be generated based on the detected language: ${detectedLanguage || "unknown"}.`,
        keyPoints: ["This is a demo key point 1", "This is a demo key point 2", "This is a demo key point 3"],
      },
      codeExamples: detectedLanguage
        ? [
            {
              id: 1,
              title: "Basic Example",
              description: `A simple ${detectedLanguage} example related to ${video.title}`,
              code: getCodeExample(detectedLanguage, "basic"),
              output: "Demo output",
              explanation: "This is a demo explanation for the code example.",
              language: detectedLanguage,
            },
            {
              id: 2,
              title: "Advanced Example",
              description: `A more complex ${detectedLanguage} example related to ${video.title}`,
              code: getCodeExample(detectedLanguage, "advanced"),
              output: "Demo advanced output",
              explanation: "This is a demo explanation for the advanced code example.",
              language: detectedLanguage,
            },
          ]
        : undefined,
      practicalExamples: !detectedLanguage
        ? [
            {
              id: 1,
              scenario: "Real-world scenario",
              problem: "A problem related to the topic",
              solution: "The solution approach",
              outcome: "The expected outcome",
            },
          ]
        : undefined,
      questions: [
        {
          id: 1,
          question: `A question about ${video.title}?`,
          options: ["Option A", "Option B", "Option C", "Option D"],
          correctAnswer: 0,
          explanation: "This is why Option A is correct.",
        },
      ],
      flashcards: [
        {
          id: 1,
          term: "Demo Term",
          definition: "Demo Definition",
        },
      ],
      glossary: [
        {
          term: "Demo Glossary Term",
          definition: "Demo Glossary Definition",
        },
      ],
      analogy: `Here's an analogy to help understand ${video.title}: It's like...`,
      challengePrompt: `Create a ${detectedLanguage || "concept"} that demonstrates your understanding of ${video.title}.`,
    }

    return NextResponse.json(demoContent)
  } catch (error) {
    console.error("Error generating demo content:", error)
    return NextResponse.json({ error: "Failed to generate demo content" }, { status: 500 })
  }
}

// Helper function to generate code examples based on language
function getCodeExample(language: string, type: "basic" | "advanced"): string {
  if (language.toLowerCase() === "python") {
    return type === "basic"
      ? `def greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("World"))`
      : `class Calculator:\n    def __init__(self, value=0):\n        self.value = value\n        \n    def add(self, x):\n        self.value += x\n        return self\n        \n    def subtract(self, x):\n        self.value -= x\n        return self\n        \ncalc = Calculator(10)\nresult = calc.add(5).subtract(3).value\nprint(result)  # Output: 12`
  }

  if (language.toLowerCase() === "javascript") {
    return type === "basic"
      ? `function greet(name) {\n  return \`Hello, \${name}!\`;\n}\n\nconsole.log(greet("World"));`
      : `class Calculator {\n  constructor(value = 0) {\n    this.value = value;\n  }\n  \n  add(x) {\n    this.value += x;\n    return this;\n  }\n  \n  subtract(x) {\n    this.value -= x;\n    return this;\n  }\n}\n\nconst calc = new Calculator(10);\nconst result = calc.add(5).subtract(3).value;\nconsole.log(result);  // Output: 12`
  }

  if (language.toLowerCase() === "java") {
    return type === "basic"
      ? `public class Greeting {\n  public static String greet(String name) {\n    return "Hello, " + name + "!";\n  }\n  \n  public static void main(String[] args) {\n    System.out.println(greet("World"));\n  }\n}`
      : `public class Calculator {\n  private int value;\n  \n  public Calculator(int value) {\n    this.value = value;\n  }\n  \n  public Calculator add(int x) {\n    this.value += x;\n    return this;\n  }\n  \n  public Calculator subtract(int x) {\n    this.value -= x;\n    return this;\n  }\n  \n  public int getValue() {\n    return this.value;\n  }\n  \n  public static void main(String[] args) {\n    Calculator calc = new Calculator(10);\n    int result = calc.add(5).subtract(3).getValue();\n    System.out.println(result);  // Output: 12\n  }\n}`
  }

  return "// Code example would be generated based on detected language"
}
