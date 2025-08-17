# Socket Hooks Usage Guide

This directory contains consolidated socket hooks that provide a clean, simple API for managing WebSocket connections in your voting game application.

## Available Hooks

### 1. `useSocket` - Core Socket Connection
**Purpose**: Manages the persistent socket connection and provides utility methods.

**Usage**: Use at the app root level or in components that need socket access.

```tsx
function App() {
  const { socket, isConnected, error, joinRoom, leaveRoom } = useSocket()
  
  if (error) {
    console.error('Socket error:', error)
  }
  
  return <YourApp />
}
```

### 2. `useRoomSocket` - Room Events
**Purpose**: Handles room-related socket events with support for both viewing and active participation modes.

**Usage**: Use in room components, passing `isActive` to indicate if user is participating.

```tsx
function RoomView({ roomId, isInRoom }) {
  useRoomSocket({
    roomId,
    isActive: isInRoom, // true = user is in room, false = just viewing
    onPlayerJoin: (userId) => console.log('Player joined:', userId),
    onPlayerLeave: (userId) => console.log('Player left:', userId),
    onRoomUpdate: (players) => console.log('Room updated:', players)
  })
  
  return <RoomContent />
}
```

### 3. `useGameSocket` - Game Events
**Purpose**: Handles game-specific socket events like round starts, answers, votes, and timers.

**Usage**: Use in game components when a game is active.

```tsx
function GameComponent({ roomId, roundId }) {
  useGameSocket({
    roomId,
    roundId,
    onGameStart: () => console.log('Game started!'),
    onRoundStart: () => console.log('Round started!'),
    onAnswerSubmitted: (userId, answer) => console.log('Answer:', answer),
    onVoteSubmitted: (userId, votedFor) => console.log('Vote:', votedFor),
    onTimerTick: (timeLeft, phase) => console.log('Timer:', timeLeft),
    onTimerEnd: (phase) => console.log('Timer ended:', phase)
  })
  
  return <GameContent />
}
```

### 4. `useSocketErrors` - Error Handling
**Purpose**: Centralized error handling for socket events.

**Usage**: Use at the app root level for global error handling.

```tsx
function App() {
  useSocketErrors() // Global error handling
  
  return <YourApp />
}
```

### 5. `useSocketStatus` - Connection Monitoring
**Purpose**: Monitors and provides detailed socket connection status.

**Usage**: Use in components that need connection status (debugging, status displays).

```tsx
function ConnectionStatus() {
  const { isConnected, isConnecting, connectionError, connectionCount } = useSocketStatus()
  
  return (
    <div>
      Status: {isConnected ? 'Connected' : isConnecting ? 'Connecting' : 'Disconnected'}
      {connectionError && <div>Error: {connectionError}</div>}
      Connections: {connectionCount}
    </div>
  )
}
```

## Recommended Architecture

```
App Root
├── useSocket() - Core connection
├── useSocketErrors() - Global error handling
└── useSocketStatus() - Connection monitoring

Room Components
├── useRoomSocket({ isActive: false }) - Viewing mode
└── useRoomSocket({ isActive: true }) - Active participation

Game Components
└── useGameSocket() - Game events
```

## Key Benefits

1. **No Duplication**: Single source of truth for socket functionality
2. **Clear Separation**: Viewing vs. active participation modes
3. **Simple API**: Easy to understand and use
4. **Automatic Cleanup**: Event listeners are properly cleaned up
5. **Type Safety**: Full TypeScript support

## Migration from Old Hooks

- Replace `usePersistentSocket` with `useSocket`
- Replace `useRoomSocketListeners` with `useRoomSocket({ isActive: true })`
- Replace `useErrorSocket` with `useSocketErrors`
- Remove `useAllSocketListeners` - use individual hooks as needed
