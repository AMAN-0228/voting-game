'use client'

import { RoundSummary } from '@/components/game'

export default function RoundSummaryDemo() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Round Summary Component Demo</h1>
          <p className="text-gray-600">
            This is a demo of the RoundSummary component that shows all rounds with expandable sections.
          </p>
        </div>
        
        {/* Demo with a sample room ID */}
        <RoundSummary roomId="demo-room-123" />
        
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Features:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Expandable round sections with round number and status</li>
            <li>• Shows question for each round</li>
            <li>• Displays all answers with vote counts</li>
            <li>• Highlights winning answers with trophy badges</li>
            <li>• Shows user's personal vote for each round</li>
            <li>• Lists all voters for each answer</li>
            <li>• Round statistics and summary</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
