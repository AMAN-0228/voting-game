'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { roomHelpers } from '@/lib/api-helpers'
import { Users, ArrowRight, Loader2 } from 'lucide-react'

interface JoinRoomDialogProps {
  children: React.ReactNode
}

export function JoinRoomDialog({ children }: JoinRoomDialogProps) {
  const [open, setOpen] = useState(false)
  const [roomCode, setRoomCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      toast.error('Please enter a room code')
      return
    }

    setIsLoading(true)
    try {
      // First, find the room by code
      const roomsResponse = await roomHelpers.joinRoomByCode(roomCode)
      if (roomsResponse.error) {
        throw new Error(roomsResponse.error)
      }
      const room = roomsResponse.data || []
      // const room = rooms.find((r: any) => r.code.toLowerCase() === roomCode.toLowerCase())
      
      if (!room) {
        toast.error('Room not found. Please check the code and try again.')
        return
      }

      // Join the room
      // await roomHelpers.joinRoomById(room.id)
      
      toast.success('Successfully joined the room!')
      setOpen(false)
      setRoomCode('')
      
      // Navigate to the room
      router.push(`/room/${room.id}`)
    } catch (error) {
      console.error('Failed to join room:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to join room')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleJoinRoom()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
        <DialogHeader className="text-center pb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-800">Join a Room</DialogTitle>
          <DialogDescription className="text-gray-600">
            Enter the room code to join an existing game room.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="space-y-3">
            <Label htmlFor="roomCode" className="text-sm font-medium text-gray-700">
              Room Code
            </Label>
            <Input
              id="roomCode"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter room code..."
              className="border-gray-200 focus:border-green-500 focus:ring-green-500 text-lg text-center tracking-wider font-mono"
              disabled={isLoading}
              autoFocus
            />
          </div>
        </div>
        
        <DialogFooter className="pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={isLoading}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleJoinRoom}
            disabled={isLoading || !roomCode.trim()}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4 mr-2" />
                Join Room
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
