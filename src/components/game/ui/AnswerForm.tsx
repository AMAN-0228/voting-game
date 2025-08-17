'use client'

import { useState, useEffect } from 'react'
import { useSocket } from '@/hooks/socket-hooks'
import { useWebSocketStore } from '@/store/websocket-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { CheckCircle, Clock, Send, Loader2, AlertCircle, Sparkles, Target, Zap } from 'lucide-react'

interface AnswerFormProps {
  userAnswer: string
  hasSubmitted: boolean
  timeLeft?: number
  handleSubmitAnswer: (answer: string) => void
}

export const AnswerForm = ({ userAnswer, hasSubmitted, timeLeft, handleSubmitAnswer }: AnswerFormProps) => {
  const [answer, setAnswer] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [charCount, setCharCount] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const { socket, isConnected } = useSocket()

  const maxLength = 500
  const isNearLimit = charCount > maxLength * 0.8
  const isAtLimit = charCount >= maxLength

  useEffect(() => {
    setCharCount(answer.length)
  }, [answer])

  useEffect(() => {
    if (isTyping) {
      const timer = setTimeout(() => setIsTyping(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [isTyping])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value.length <= maxLength) {
      setAnswer(value)
      setIsTyping(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isConnected) {
      toast.error('Not connected to server. Please wait...')
      return
    }

    if (!answer.trim() || hasSubmitted || isSubmitting) return

    setIsSubmitting(true)
    try {
      handleSubmitAnswer(answer)
      setAnswer('')
      toast.success('Answer submitted successfully!')
    } catch (error) {
      console.error('Error submitting answer:', error)
      toast.error('Failed to submit answer')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCharCountColor = () => {
    if (isAtLimit) return 'text-red-600'
    if (isNearLimit) return 'text-orange-600'
    return 'text-gray-500'
  }

  const getCharCountBg = () => {
    if (isAtLimit) return 'bg-red-100'
    if (isNearLimit) return 'bg-orange-100'
    return 'bg-gray-100'
  }

  if (hasSubmitted) {
    return (
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-xl">
        <CardContent className="pt-12 pb-12">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <Badge variant="default" className="text-lg px-4 py-2 mb-4 bg-green-600 text-white border-0">
              ✓ Answer Submitted
            </Badge>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Great job!</h3>
            <p className="text-gray-600 text-lg max-w-md mx-auto">Your answer: <span className="font-bold">{userAnswer}</span></p>
            <p className="text-gray-600 text-lg max-w-md mx-auto">
              Waiting for other players to submit their answers...
            </p>
            {timeLeft && (
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Time remaining: {timeLeft}s</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
        <CardTitle className="flex items-center justify-between text-xl">
          <span className="flex items-center gap-3">
            <Target className="w-6 h-6 text-blue-600" />
            Submit Your Answer
          </span>
          {timeLeft && (
            <Badge 
              variant={timeLeft < 10 ? 'destructive' : timeLeft < 30 ? 'default' : 'secondary'}
              className={`text-sm px-3 py-1 ${
                timeLeft < 10 
                  ? 'bg-red-100 text-red-700 border-red-200 animate-pulse' 
                  : timeLeft < 30
                  ? 'bg-orange-100 text-orange-700 border-orange-200'
                  : 'bg-blue-100 text-blue-700 border-blue-200'
              }`}
            >
              <Clock className="w-3 h-3 mr-1" />
              {timeLeft}s left
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Answer Input */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Your Answer
            </label>
            
            <div className="relative">
              <Input
                type="text"
                placeholder="Type your creative answer here..."
                value={answer}
                onChange={handleInputChange}
                disabled={isSubmitting || !isConnected}
                maxLength={maxLength}
                className={`text-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 placeholder-gray-400 transition-all duration-200 ${
                  isTyping ? 'ring-2 ring-blue-200' : ''
                } ${isAtLimit ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              />
              
              {/* Character Counter */}
              <div className="absolute -bottom-6 right-0">
                <Badge 
                  variant="outline" 
                  className={`text-xs px-2 py-1 ${getCharCountBg()} ${getCharCountColor()} border-0`}
                >
                  {charCount}/{maxLength}
                </Badge>
              </div>
            </div>

            {/* Input Status */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {!isConnected && (
                  <span className="text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Not connected
                  </span>
                )}
                {isTyping && (
                  <span className="text-blue-500 flex items-center gap-1 animate-pulse">
                    <Zap className="w-3 h-3" />
                    Typing...
                  </span>
                )}
              </div>
              
              {/* Character Limit Warning */}
              {isNearLimit && (
                <span className={`text-xs ${getCharCountColor()}`}>
                  {isAtLimit ? 'Character limit reached!' : 'Approaching character limit'}
                </span>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={!answer.trim() || isSubmitting || !isConnected || isAtLimit}
            className={`w-full py-3 text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ${
              isAtLimit
                ? 'bg-gray-400 cursor-not-allowed hover:scale-100'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
            }`}
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Submit Answer
              </>
            )}
          </Button>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-700 mb-2">
              <Target className="w-4 h-4" />
              <span className="text-sm font-medium">Tips for a great answer:</span>
            </div>
            <ul className="text-blue-600 text-sm space-y-1">
              <li>• Be creative and original</li>
              <li>• Keep it concise but descriptive</li>
              <li>• Think about what others might find funny or clever</li>
            </ul>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
