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
  'If you could instantly learn any language, which would you choose and why?',
  'What would be your ideal way to spend a million dollars?',
  'If you could time travel, would you go to the past or future?',
  'What\'s the strangest thing you\'ve ever eaten?',
  'If you could be famous for one thing, what would it be?',
  'What\'s the most embarrassing thing that happened to you in school?',
  'If you could have any animal as a pet, what would you choose?',
  'What\'s the weirdest thing you believed as a child?',
  'If you could only eat one cuisine for the rest of your life, what would it be?',
  'What\'s the most interesting job you can think of?',
  'If you could solve one world problem, what would it be?',
  'What would be your perfect day from start to finish?',
  'If you could be any age for the rest of your life, what age would you choose?',
  'What\'s the most unusual talent you have?',
  'If you could live anywhere in the world, where would it be?',
  'What\'s the best prank you\'ve ever pulled or been part of?',
  'If you could have any vehicle, what would you choose?',
  'What\'s the most interesting fact you know?',
  'If you could be any fictional character, who would you be?',
  'What would be your superhero name and power?',
  'If you could have any job for one day, what would it be?',
  'What\'s the most unusual thing you\'ve ever done to avoid something?',
  'If you could have any magical item, what would it be?',
  'What\'s the most interesting conversation you\'ve ever had?',
  'If you could change one thing about yourself, what would it be?',
  'What would be your ideal vacation destination?',
  'If you could have any celebrity as a best friend, who would you choose?',
  'What\'s the most unusual hobby you can think of?',
  'If you could be any profession for a week, what would you try?',
  'What\'s the most interesting thing you\'ve learned recently?',
  'If you could have any food delivered right now, what would it be?',
  'What would be your perfect weekend?',
  'If you could have any musical instrument skill, what would you choose?',
  'What\'s the most unusual thing you\'ve ever seen?',
  'If you could have any technology from the future, what would it be?',
  'What\'s the most interesting tradition in your family?',
  'If you could have any book character as a roommate, who would it be?',
  'What would be your ideal way to make money?',
  'If you could have any plant or tree in your backyard, what would you choose?',
  'What\'s the most unusual thing you\'ve ever collected?',
  'If you could have any weather condition year-round, what would it be?',
  'What\'s the most interesting thing you\'ve ever built or created?',
  'If you could have any historical event happen again, what would you choose?',
  'What would be your perfect birthday celebration?',
  'If you could have any type of intelligence, what would you choose?',
  'What\'s the most unusual thing you\'ve ever done for fun?',
  'If you could have any type of art skill, what would you choose?',
  'What\'s the most interesting thing you\'ve ever discovered?'
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
  if (process.env.NODE_ENV !== 'production') {
    return getFallbackQuestions(numQuestions)
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
