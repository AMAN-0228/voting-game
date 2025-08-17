# Round Summary Component

The `RoundSummary` component is a comprehensive display component that shows all rounds of a game with expandable sections, providing detailed information about each round including questions, answers, votes, and winners.

## Features

### 🎯 **Round Overview**
- **Round Number**: Clear display of round sequence number (Sno)
- **Status Badges**: Visual indicators for round status (pending, active, voting, finished)
- **Question Display**: Shows the question for each round
- **Total Votes**: Displays the total number of votes cast in each round

### 🔍 **Expandable Sections**
- **Click to Expand**: Each round can be expanded to show detailed information
- **Collapsible Content**: Users can hide/show detailed information as needed
- **First Round Auto-Expanded**: The first round is automatically expanded for better UX

### 📊 **Detailed Round Information**
- **User's Vote**: Shows what the current user voted for in each round
- **All Answers**: Displays every answer submitted with:
  - Answer content
  - Author name
  - Vote count received
  - List of voters
- **Winning Answer**: Highlights the answer with the most votes
- **Round Statistics**: Summary of total answers and votes

### 🏆 **Winner Recognition**
- **Trophy Badges**: Special highlighting for winning answers
- **Vote Counts**: Clear display of how many votes each answer received
- **Author Attribution**: Shows who submitted each answer

## Usage

### Basic Implementation

```tsx
import { RoundSummary } from '@/components/game'

function GamePage({ roomId }: { roomId: string }) {
  return (
    <div>
      <h1>Game Summary</h1>
      <RoundSummary roomId={roomId} />
    </div>
  )
}
```

### Integration Points

The component is designed to be used in multiple contexts:

1. **Game Finished Page**: Automatically shows when a game ends
2. **Game Interface**: Can be toggled during active gameplay
3. **Rounds Management**: Available in the rounds management section
4. **Standalone Display**: Can be used anywhere you need round summaries

## Architecture

The component follows a clean architecture pattern:

### **Actions Layer** (`src/actions/rounds.ts`)
- **Business Logic**: All round-related business logic is contained in action files
- **Data Processing**: Vote counting, winner calculation, and data transformation
- **Authorization**: User permission checks and validation
- **Database Operations**: Prisma queries and data manipulation

### **API Routes** (`src/app/api/rounds/room/[roomId]/summary/route.ts`)
- **Thin Layer**: API routes only handle HTTP concerns (request/response)
- **Authentication**: Session validation and user identification
- **Action Calls**: Delegates business logic to action functions
- **Error Handling**: HTTP status codes and error responses

### **Data Flow**
1. **Component** → **API Route** → **Action** → **Database**
2. **Action** returns structured data with success/error information
3. **API Route** converts action results to HTTP responses
4. **Component** receives and displays the data

## API Endpoint

The component fetches data from: `/api/rounds/room/[roomId]/summary`

This endpoint provides:
- All rounds for the specified room
- Detailed answer information with vote counts
- User voting history
- Winner calculations
- Round statistics

## Data Structure

```typescript
interface Round {
  id: string
  sno: number                    // Round sequence number
  question: string              // Round question
  status: string                // Round status
  createdAt: string            // Creation timestamp
  answers: Answer[]            // All answers for this round
  winningAnswer: Answer | null // Answer with most votes
  userVote: UserVote | null   // Current user's vote
  totalVotes: number          // Total votes cast
}

interface Answer {
  id: string
  content: string
  userId: string
  userName: string
  voteCount: number
  voters: Voter[]
}

interface UserVote {
  answerId: string
  answerContent: string
  votedForUser: string
}
```

## Styling

The component uses:
- **Tailwind CSS** for responsive design
- **Shadcn/ui** components for consistent UI
- **Lucide React** icons for visual elements
- **Color-coded badges** for different statuses and states

## Responsive Design

- **Mobile-friendly**: Adapts to different screen sizes
- **Touch-friendly**: Large touch targets for mobile devices
- **Accessible**: Proper ARIA labels and keyboard navigation

## Error Handling

- **Loading States**: Shows spinner while fetching data
- **Error States**: Displays error messages with retry options
- **Empty States**: Handles cases with no rounds gracefully

## Performance

- **Lazy Loading**: Only fetches data when component mounts
- **Efficient Rendering**: Uses React state management for smooth interactions
- **Optimized API Calls**: Single API call for all round data

## Customization

The component can be customized by:
- Modifying the API endpoint
- Adjusting the styling classes
- Adding additional data fields
- Changing the expand/collapse behavior

## Dependencies

- React 18+
- Next.js 13+
- Tailwind CSS
- Shadcn/ui components
- Lucide React icons
- Sonner for toast notifications

## Example Screenshots

The component displays:
1. **Collapsed View**: Round number, status, question, and vote count
2. **Expanded View**: Full details including answers, votes, and winners
3. **Interactive Elements**: Expand/collapse buttons and status indicators
4. **Visual Hierarchy**: Clear organization of information with proper spacing

## Benefits of Action-Based Architecture

### **Separation of Concerns**
- **API Routes**: Handle HTTP-specific logic (status codes, headers, request parsing)
- **Actions**: Contain business logic, validation, and data processing
- **Components**: Focus on UI rendering and user interaction

### **Reusability**
- Actions can be called from multiple API routes
- Business logic is centralized and easily testable
- Consistent error handling and response formats

### **Maintainability**
- Business logic changes only require updating actions
- API routes remain simple and focused
- Easier to write unit tests for business logic

### **Type Safety**
- Strong TypeScript interfaces for all data structures
- Consistent error handling with typed result objects
- Better IDE support and compile-time error checking

## Future Enhancements

Potential improvements could include:
- **Real-time Updates**: Live updates via WebSocket
- **Export Functionality**: Download round summaries as PDF/CSV
- **Advanced Filtering**: Filter rounds by status, date, or other criteria
- **Search Functionality**: Search through questions and answers
- **Analytics**: Charts and graphs showing voting patterns
