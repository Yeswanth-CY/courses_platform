import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

// Rate limiting
let requestCount = 0
let lastResetTime = Date.now()
const RATE_LIMIT = 12 // requests per minute
const RATE_WINDOW = 60000 // 1 minute

export async function POST(request: Request) {
  try {
    const { message, userId } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Check rate limit
    const now = Date.now()
    if (now - lastResetTime > RATE_WINDOW) {
      requestCount = 0
      lastResetTime = now
    }

    if (requestCount >= RATE_LIMIT) {
      const waitTime = RATE_WINDOW - (now - lastResetTime)
      await new Promise((resolve) => setTimeout(resolve, waitTime))
      requestCount = 0
      lastResetTime = Date.now()
    }

    requestCount++

    // Determine the best response format based on the question
    const responseFormat = determineResponseFormat(message)

    // Generate dynamic content using Gemini
    const aiContent = await generateDynamicContent(message, responseFormat)

    // Log the interaction
    await logInteraction(userId, message, aiContent)

    return NextResponse.json(aiContent)
  } catch (error: any) {
    console.error("Error in peer tutor API:", error)

    // Provide a meaningful fallback
    const { message } = await request.json() // Extract message again for fallback
    const fallbackResponse = await generateFallbackResponse(message)
    return NextResponse.json(fallbackResponse)
  }
}

function determineResponseFormat(question: string): string {
  const lowerQuestion = question.toLowerCase()

  if (lowerQuestion.includes("code") || lowerQuestion.includes("example") || lowerQuestion.includes("syntax")) {
    return "code_example"
  } else if (lowerQuestion.includes("explain") || lowerQuestion.includes("what is") || lowerQuestion.includes("how")) {
    return "structured_explanation"
  } else if (lowerQuestion.includes("difference") || lowerQuestion.includes("compare")) {
    return "comparison"
  } else if (lowerQuestion.includes("step") || lowerQuestion.includes("tutorial") || lowerQuestion.includes("guide")) {
    return "step_by_step"
  } else if (lowerQuestion.includes("practice") || lowerQuestion.includes("exercise")) {
    return "practice_exercise"
  } else {
    return "comprehensive_guide"
  }
}

async function generateDynamicContent(question: string, format: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

  let prompt = ""

  switch (format) {
    case "code_example":
      prompt = `
        You are an expert programming tutor. Provide a comprehensive response for: "${question}"
        
        IMPORTANT FORMATTING RULES:
        - DO NOT use any markdown symbols like #, *, -, or backticks
        - Use clean, readable text with proper spacing
        - For code examples, provide clean, properly indented code without markdown formatting
        - Use clear section breaks with line spacing
        - Make all content easily readable and well-structured
        
        Generate a JSON response with this exact structure:
        {
          "type": "code_example",
          "title": "Clear, specific title about the concept",
          "explanation": "Detailed explanation in 2-3 sentences without any markdown symbols",
          "codeExamples": [
            {
              "language": "programming language name",
              "code": "Clean, properly formatted code with proper indentation and comments. No backticks or markdown.",
              "description": "Clear description of what this code demonstrates"
            }
          ],
          "keyPoints": [
            "Important concept 1 explained clearly",
            "Important concept 2 explained clearly", 
            "Important concept 3 explained clearly"
          ],
          "practicalTips": [
            "Practical tip 1 for implementation",
            "Practical tip 2 for best practices"
          ],
          "nextSteps": [
            "What to learn next",
            "Advanced topics to explore"
          ]
        }
        
        Make the code examples realistic, properly formatted, and educational. Ensure all text is clean without markdown symbols.
      `
      break

    case "structured_explanation":
      prompt = `
        You are an expert educator. Provide a structured explanation for: "${question}"
        
        IMPORTANT FORMATTING RULES:
        - DO NOT use any markdown symbols like #, *, -, or backticks
        - Use clean, readable text with proper spacing
        - Structure content with clear sections
        - Make everything easily readable
        
        Generate a JSON response with:
        {
          "type": "structured_explanation",
          "title": "Clear, specific title",
          "overview": "Brief overview in 1-2 sentences",
          "sections": [
            {
              "heading": "Section title",
              "content": "Detailed explanation with proper spacing",
              "examples": ["relevant example 1", "relevant example 2"]
            }
          ],
          "analogy": "A helpful real-world analogy that makes the concept clear",
          "keyTakeaways": [
            "Main point 1 to remember",
            "Main point 2 to remember",
            "Main point 3 to remember"
          ],
          "commonMistakes": [
            "Common mistake 1 to avoid",
            "Common mistake 2 to avoid"
          ]
        }
        
        Make it educational, engaging, and easy to understand without any markdown formatting.
      `
      break

    case "comparison":
      prompt = `
        You are an expert tutor. Provide a detailed comparison for: "${question}"
        
        FORMATTING RULES: No markdown symbols. Clean, readable text only.
        
        Generate a JSON response with:
        {
          "type": "comparison",
          "title": "Comparison title",
          "introduction": "Brief intro to what's being compared",
          "comparisonTable": [
            {
              "aspect": "What's being compared",
              "option1": "First option details",
              "option2": "Second option details"
            }
          ],
          "prosAndCons": {
            "option1": {
              "name": "Option 1 name",
              "pros": ["advantage 1", "advantage 2"],
              "cons": ["disadvantage 1", "disadvantage 2"]
            },
            "option2": {
              "name": "Option 2 name", 
              "pros": ["advantage 1", "advantage 2"],
              "cons": ["disadvantage 1", "disadvantage 2"]
            }
          },
          "recommendation": "When to use which option with clear guidance"
        }
      `
      break

    case "step_by_step":
      prompt = `
        You are an expert instructor. Provide a step-by-step guide for: "${question}"
        
        FORMATTING RULES: No markdown symbols. Clean, readable text with proper structure.
        
        Generate a JSON response with:
        {
          "type": "step_by_step",
          "title": "Step-by-step guide title",
          "introduction": "What this guide will teach",
          "prerequisites": ["prerequisite 1", "prerequisite 2"],
          "steps": [
            {
              "stepNumber": 1,
              "title": "Step title",
              "description": "Detailed explanation",
              "code": "Clean code example if applicable (no markdown formatting)",
              "tips": ["helpful tip 1", "helpful tip 2"]
            }
          ],
          "summary": "What you've accomplished after following these steps"
        }
      `
      break

    case "practice_exercise":
      prompt = `
        You are an expert coding instructor. Create a practice exercise for: "${question}"
        
        FORMATTING RULES: No markdown symbols. Clean, readable text and code.
        
        Generate a JSON response with:
        {
          "type": "practice_exercise",
          "title": "Exercise title",
          "difficulty": "Beginner/Intermediate/Advanced",
          "objective": "What the student will learn",
          "problem": "Clear problem statement",
          "requirements": ["requirement 1", "requirement 2"],
          "hints": ["helpful hint 1", "helpful hint 2"],
          "sampleInput": "example input",
          "expectedOutput": "expected output",
          "solution": {
            "code": "Complete solution with proper indentation and comments (no markdown)",
            "explanation": "Step-by-step explanation of the solution"
          },
          "variations": ["way to extend 1", "way to extend 2"]
        }
      `
      break

    default:
      prompt = `
        You are an expert tutor. Provide a comprehensive learning resource for: "${question}"
        
        FORMATTING RULES: No markdown symbols. Clean, readable text only.
        
        Generate a JSON response with:
        {
          "type": "comprehensive_guide",
          "title": "Comprehensive title",
          "overview": "What this covers",
          "learningObjectives": ["objective 1", "objective 2"],
          "sections": [
            {
              "heading": "Section title",
              "content": "Detailed content",
              "codeExample": "code if relevant (clean formatting)",
              "practicalApplication": "real-world use case"
            }
          ],
          "quickReference": ["key point 1", "key point 2"],
          "exercises": ["practice suggestion 1", "practice suggestion 2"]
        }
      `
  }

  try {
    const result = await model.generateContent(prompt)
    const response = result.response.text()

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsedContent = JSON.parse(jsonMatch[0])
      return parsedContent
    }
  } catch (parseError) {
    console.error("Failed to parse AI response:", parseError)
  }

  // Enhanced fallback
  return generateEnhancedFallback(question, format)
}

function generateEnhancedFallback(question: string, format: string) {
  const topics = extractTopics(question)
  const isCodeRelated =
    question.toLowerCase().includes("code") ||
    question.toLowerCase().includes("java") ||
    question.toLowerCase().includes("python") ||
    question.toLowerCase().includes("javascript")

  if (format === "code_example" && isCodeRelated) {
    return {
      type: "code_example",
      title: `Understanding ${topics.join(" and ")}`,
      explanation: `Let me explain ${topics.join(" and ")} with practical examples. This concept is fundamental in programming and helps you write better, more organized code.`,
      codeExamples: [
        {
          language: detectLanguage(question),
          code: generateSampleCode(question, topics),
          description: `Basic example demonstrating ${topics.join(" and ")}`,
        },
      ],
      keyPoints: [
        `${topics[0]} helps organize code into reusable components`,
        "Proper implementation improves code maintainability",
        "Understanding this concept is essential for advanced programming",
      ],
      practicalTips: [
        "Start with simple examples before moving to complex implementations",
        "Practice with different scenarios to master the concept",
      ],
      nextSteps: ["Try implementing your own examples", "Explore advanced features and patterns"],
    }
  }

  return {
    type: format,
    title: `Learning about ${topics.join(" and ")}`,
    content: `I'd be happy to help you understand ${topics.join(" and ")}. This is an important concept that will help you in your learning journey.`,
    sections: [
      {
        heading: "Overview",
        content: `${topics.join(" and ")} are fundamental concepts that every learner should understand.`,
        examples: ["Real-world applications", "Practical use cases"],
      },
    ],
    keyPoints: [
      "Understanding the basics is crucial",
      "Practice helps reinforce learning",
      "Apply concepts to real projects",
    ],
  }
}

function extractTopics(question: string): string[] {
  const commonTopics = [
    "oop",
    "object oriented programming",
    "classes",
    "objects",
    "inheritance",
    "polymorphism",
    "encapsulation",
    "abstraction",
    "java",
    "python",
    "javascript",
    "functions",
    "variables",
    "loops",
    "arrays",
    "strings",
    "algorithms",
    "data structures",
  ]

  const found = commonTopics.filter((topic) => question.toLowerCase().includes(topic))

  return found.length > 0 ? found.slice(0, 3) : ["programming concepts"]
}

function detectLanguage(question: string): string {
  const lowerQuestion = question.toLowerCase()
  if (lowerQuestion.includes("java")) return "java"
  if (lowerQuestion.includes("python")) return "python"
  if (lowerQuestion.includes("javascript")) return "javascript"
  if (lowerQuestion.includes("c++")) return "cpp"
  if (lowerQuestion.includes("c#")) return "csharp"
  return "java" // default
}

function generateSampleCode(question: string, topics: string[]): string {
  const language = detectLanguage(question)

  if (language === "java" && topics.some((t) => t.includes("oop") || t.includes("class"))) {
    return `// Example of Object-Oriented Programming in Java
class Animal {
    private String name;
    private int age;
    
    // Constructor
    public Animal(String name, int age) {
        this.name = name;
        this.age = age;
    }
    
    // Getter methods
    public String getName() {
        return name;
    }
    
    public int getAge() {
        return age;
    }
    
    // Method to display animal information
    public void displayInfo() {
        System.out.println("Name: " + name + ", Age: " + age);
    }
}

// Inheritance example
class Dog extends Animal {
    private String breed;
    
    public Dog(String name, int age, String breed) {
        super(name, age);
        this.breed = breed;
    }
    
    public void bark() {
        System.out.println(getName() + " is barking!");
    }
    
    @Override
    public void displayInfo() {
        super.displayInfo();
        System.out.println("Breed: " + breed);
    }
}

// Usage example
public class Main {
    public static void main(String[] args) {
        Dog myDog = new Dog("Buddy", 3, "Golden Retriever");
        myDog.displayInfo();
        myDog.bark();
    }
}`
  }

  return `// Sample code example
public class Example {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`
}

async function generateFallbackResponse(question: string) {
  return {
    type: "fallback",
    title: `Help with: ${question}`,
    content: "I'm here to help you learn! Let me provide some guidance on your question.",
    suggestions: [
      "Try asking about specific programming concepts",
      "Request code examples for better understanding",
      "Ask for step-by-step explanations",
      "I can help with explanations, comparisons, and practice exercises",
    ],
  }
}

async function logInteraction(userId: string, question: string, response: any) {
  try {
    console.log(`Peer Tutor - User ${userId} asked: "${question}"`)
    console.log(`Response type: ${response.type}`)
  } catch (error) {
    console.error("Failed to log interaction:", error)
  }
}
