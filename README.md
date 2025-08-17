# Voting Gaming - Interactive Multiplayer Game

A real-time multiplayer voting game built with Next.js, Socket.IO, and Prisma.

## Features

- **Real-time Multiplayer**: Live game sessions with Socket.IO
- **Room Management**: Create and join game rooms with unique codes
- **Voting System**: Interactive voting mechanics for game rounds
- **Authentication**: Secure user authentication with NextAuth.js
- **Responsive UI**: Modern, mobile-friendly interface with Tailwind CSS

## Architecture

The application follows a hybrid approach combining REST APIs with WebSocket events:

- **API First**: All data operations go through REST endpoints
- **Socket Events**: Real-time communication for game state updates
- **Separation of Concerns**: Database operations and socket events are clearly separated

### Room Joining Flow

The room joining system has been refactored for better reliability:

1. **API Call**: User joins room via REST API endpoint
2. **Socket Event**: Client emits `room:join` after successful API response
3. **Server Response**: Server emits `roomData` with fresh room state

See [ROOM_JOIN_FLOW.md](docs/ROOM_JOIN_FLOW.md) for detailed implementation details.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Development

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Redis (for session storage)

### Environment Variables
Create a `.env.local` file with:
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### Database Setup
```bash
npx prisma generate
npx prisma db push
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
