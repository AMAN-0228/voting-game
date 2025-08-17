# Persistent Socket Connection Solution

## 🎯 **Problem Solved**

**Before**: Socket connections were being created and destroyed on every:
- Page navigation
- Component mount/unmount
- Route changes
- Fast Refresh (development)

**Result**: Frequent disconnections, poor user experience, server seeing constant connect/disconnect cycles

## 🚀 **Solution Implemented**

### **1. Global Socket Manager**

**File**: `src/lib/socket-client.ts`

**Key Features**:
- **Single Global Instance**: Only one socket connection for the entire app
- **Persistent Across Navigation**: Socket survives page changes and component lifecycle
- **Smart Connection Management**: Reuses existing connections when possible
- **Promise-based Initialization**: Prevents multiple simultaneous connection attempts

**Core Functions**:
```typescript
// Initialize global connection
export const initSocketClient = async (config: SocketConfig): Promise<SocketClient>

// Get existing connection or create new one
export const getOrCreateSocket = async (config: SocketConfig): Promise<SocketClient>

// Get current socket (may be null)
export const getSocketClient = (): SocketClient | null

// Check connection status
export const isSocketConnected = (): boolean

// Force disconnect (only on logout/app shutdown)
export const disconnectSocket = (): void
```

### **2. Persistent Socket Hook**

**File**: `src/hooks/socket-hooks/usePersistentSocket.ts`

**Key Features**:
- **Reuses Existing Connections**: Never creates duplicate sockets
- **Automatic Reconnection**: Handles disconnections gracefully
- **Clean Component Lifecycle**: Doesn't disconnect on unmount
- **Helper Functions**: Provides easy-to-use emit, joinRoom, leaveRoom methods

**Usage**:
```typescript
import { usePersistentSocket } from '@/hooks/socket-hooks'

const { socket, isConnected, joinRoom, leaveRoom } = usePersistentSocket()

// Join room without creating new connection
joinRoom(roomId)

// Emit events using persistent connection
socket?.emit('game:answer:submit', { roomId, roundId, answer })
```

### **3. Updated WebSocket Store**

**File**: `src/store/websocket-store.ts`

**Key Changes**:
- **Persistent Connection Management**: Uses global socket manager
- **No More Reconnections**: Store doesn't create/destroy connections
- **Better Error Handling**: Proper async connection management
- **Room State Management**: Tracks current room without affecting socket

## 🔄 **How It Works**

### **Connection Flow**:
1. **App Start**: SocketProvider initializes global connection
2. **Page Navigation**: Components use `usePersistentSocket` hook
3. **Hook Logic**: Checks for existing connection → uses it if available
4. **No Disconnection**: Socket stays connected during navigation
5. **Cleanup**: Only disconnects on logout or app shutdown

### **Component Usage**:
```typescript
// Before (caused disconnections)
const { socket } = useWebSocketStore()
useEffect(() => {
  if (socket) {
    socket.emit('room:join', { roomId })
  }
}, [socket, roomId])

// After (persistent connection)
const { joinRoom, isConnected } = usePersistentSocket()
useEffect(() => {
  if (isConnected) {
    joinRoom(roomId)
  }
}, [isConnected, roomId])
```

## 📊 **Benefits**

### **For Users**:
- ✅ **No More Disconnections** during page navigation
- ✅ **Faster Room Joining** (no reconnection delays)
- ✅ **Better Game Experience** (stable real-time updates)
- ✅ **Seamless Navigation** between pages

### **For Server**:
- ✅ **Reduced Connection Load** (fewer connect/disconnect cycles)
- ✅ **Better Resource Management** (stable user sessions)
- ✅ **Improved Scalability** (fewer socket instances)
- ✅ **Cleaner Logs** (less connection noise)

### **For Developers**:
- ✅ **Easier Debugging** (stable connection state)
- ✅ **Better Performance** (no connection overhead)
- ✅ **Cleaner Code** (no connection management in components)
- ✅ **Predictable Behavior** (connection lifecycle is clear)

## 🛠️ **Implementation Details**

### **Connection Persistence**:
```typescript
// Global variables in socket-client.ts
let globalSocket: SocketClient | null = null
let connectionPromise: Promise<SocketClient> | null = null

// Smart connection logic
export const getOrCreateSocket = async (config: SocketConfig) => {
  if (globalSocket && globalSocket.connected) {
    return globalSocket // Reuse existing connection
  }
  return initSocketClient(config) // Create new only if needed
}
```

### **Component Lifecycle**:
```typescript
// usePersistentSocket hook
useEffect(() => {
  // Check for existing connection first
  const existingSocket = getSocketClient()
  if (existingSocket && isSocketConnected()) {
    setSocket(existingSocket) // Reuse existing
    return
  }
  
  // Create new only if needed
  connectSocket()
}, [/* dependencies */])

// Cleanup doesn't disconnect global socket
useEffect(() => {
  return () => {
    setSocket(null) // Just clear local state
  }
}, [])
```

## 🚀 **Migration Guide**

### **Step 1: Update Components**
Replace `useWebSocketStore` with `usePersistentSocket`:
```typescript
// Old way
import { useWebSocketStore } from '@/store/websocket-store'
const { socket } = useWebSocketStore()

// New way
import { usePersistentSocket } from '@/hooks/socket-hooks'
const { socket, isConnected, joinRoom } = usePersistentSocket()
```

### **Step 2: Update Socket Usage**
Use helper functions instead of direct socket access:
```typescript
// Old way
socket?.emit('room:join', { roomId })

// New way
joinRoom(roomId)
```

### **Step 3: Remove Connection Logic**
Components no longer need to manage connections:
```typescript
// Remove this from components
useEffect(() => {
  // No more connection management needed
}, [])
```

## 🔍 **Testing the Solution**

### **Expected Behavior**:
1. **First Page Load**: Creates socket connection
2. **Navigate to Room**: Socket stays connected, emits room:join
3. **Navigate Away**: Socket remains connected
4. **Return to Room**: Socket still connected, no reconnection
5. **Logout**: Only then does socket disconnect

### **Console Logs to Watch**:
```
[SOCKET CLIENT] Creating new socket connection
[SOCKET CLIENT] Connected with ID: abc123
[usePersistentSocket] Using existing socket connection: abc123
[usePersistentSocket] Using existing socket connection: abc123
```

## 🎉 **Result**

**Before**: Server saw constant connect/disconnect cycles
**After**: Server sees stable, persistent connections

Users can now navigate freely between pages without losing their socket connection, providing a much better real-time gaming experience!
