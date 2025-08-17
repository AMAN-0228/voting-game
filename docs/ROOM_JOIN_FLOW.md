# Room Joining Flow - Refactored Architecture

## Overview

This document describes the refactored room joining flow that separates API calls from socket events for better reliability and consistency.

## New Flow

### 1. User Joins Room
- User clicks "Join Room" button or enters room code
- Client makes API call to join room endpoint
- API validates user and adds them to room in database

### 2. Client Emits Socket Event
- After successful API response, client emits `room:join` socket event
- This ensures the API call succeeded before attempting socket communication

### 3. Server Responds with Room Data
- Server receives `room:join` event
- Server emits `roomData` event back to the joining user
- Server also emits `room:join` to notify other players in the room

## Benefits

1. **Reliability**: API call must succeed before socket events are sent
2. **Consistency**: Database state is always updated before socket communication
3. **Error Handling**: Clear separation between API errors and socket errors
4. **Scalability**: API can handle authentication and validation independently

## Implementation Details

### Client Side
- `JoinRoomButton.tsx`: Emits `room:join` after successful API call
- `JoinRoomDialog.tsx`: Emits `room:join` after successful room code join
- `useRoom.ts`: Emits `room:join` after successful programmatic join

### Server Side
- `roomHandlers.ts`: Listens for `room:join` and emits `roomData` back
- API routes: Handle database operations without socket emissions

### Socket Events
- **Client → Server**: `room:join` (with roomId)
- **Server → Client**: `roomData` (with full room state)
- **Server → Room**: `room:join` (to notify other players)

## Code Examples

### Client Emitting Event
```typescript
// After successful API call
const result = await roomHelpers.joinRoomById(roomId)
if (result.error) {
  // Handle error
  return
}

// Emit socket event
if (socket) {
  socket.emit('room:join', { roomId })
}
```

### Server Handling Event
```typescript
socket.on('room:join', async ({ roomId }) => {
  // Join socket room
  await socket.join(roomId)
  
  // Get fresh room state
  const state = await getRoomState(roomId)
  
  // Emit roomData to joining user
  socket.emit('roomData', {
    roomId,
    status: state.status,
    players: state.players,
    hostId: state.hostId
  })
  
  // Notify other players
  io.to(roomId).emit('room:join', {
    roomId,
    userId: socket.data.userId,
    userName: socket.data.username
  })
})
```

## Migration Notes

- Old flow: Client emitted `room:join` immediately, server handled everything
- New flow: API first, then socket events
- All existing components have been updated to follow this pattern
- Backward compatibility maintained for existing socket listeners
