import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini with API key from environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

// Fallback questions in case Gemini fails
const FALLBACK_QUESTIONS = [
  'What would you do if you could be invisible for a day?',
  'If you could have dinner with any historical figure, who would it be and why?',
  'What\'s the most unusual food combination you enjoy?',
  'If you could instantly master any skill, what would it be?',
  'What\'s the most interesting place you\'ve ever visited?',
  'If you could have any superpower, what would it be and why?',
  'What\'s the best piece of advice you\'ve ever received?',
  'If you could live in any fictional universe, which would you choose?',
  'What\'s the most memorable dream you\'ve ever had?',
  'If you could instantly learn any language, which would you choose and why?'
]

/**
 * Prompts Gemini to generate engaging questions for the game
 */
async function generateQuestionsWithGemini(numQuestions: number): Promise<string[]> {
  try {
    const prompt = `Generate ${numQuestions} unique, engaging questions for a social party game. 
    The questions should:
    - Be open-ended and encourage creative answers
    - Be fun and lighthearted
    - Not be too personal or controversial
    - Be suitable for all ages
    - Each be 1-2 sentences long
    - Not require specific knowledge
    - Not include numbers in the list (just return the questions)
    
    Example good questions:
    - What would you do if you could be invisible for a day?
    - If you could have dinner with any historical figure, who would it be and why?
    - What's the most unusual food combination you enjoy?`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Split into lines and filter empty ones
    const questions = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line.length > 0)
      // Remove any bullet points or numbers
      .map(line => line.replace(/^[-•\d.)\s]+/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, numQuestions)

    // Validate we got enough questions
    if (questions.length < numQuestions) {
      throw new Error('Not enough questions generated')
    }

    return questions
  } catch (error) {
    console.error('Error generating questions with Gemini:', error)
    return getFallbackQuestions(numQuestions)
  }
}

/**
 * Returns a subset of fallback questions if Gemini fails
 */
function getFallbackQuestions(numQuestions: number): string[] {
  // Shuffle array to get random questions
  const shuffled = [...FALLBACK_QUESTIONS]
    .sort(() => Math.random() - 0.5)
    .slice(0, numQuestions)
  
  return shuffled
}

/**
 * Main export: Generates questions for a game, falling back to defaults if needed
 */
export async function generateQuestions(numQuestions: number): Promise<string[]> {
  if (numQuestions < 1 || numQuestions > 10) {
    throw new Error('Number of questions must be between 1 and 10')
  }

  try {
    // First try with Gemini
    const questions = await generateQuestionsWithGemini(numQuestions)
    return questions
  } catch (error) {
    // If anything fails, use fallback questions
    console.error('Failed to generate questions, using fallbacks:', error)
    return getFallbackQuestions(numQuestions)
  }
}
