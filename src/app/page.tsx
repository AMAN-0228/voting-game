"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RoomCard, type RoomListItem } from '@/components/rooms/RoomCard'
import { CreateRoomDialog } from '@/components/rooms/CreateRoomDialog'
import { JoinRoomDialog } from '@/components/rooms/JoinRoomDialog'
import { roomHelpers } from '@/lib/api-helpers'
import { Plus, Gamepad2, Users, Crown } from 'lucide-react'

interface RoomData {
  id: string
  code: string
  status: 'starting' | 'in_progress' | 'done'
  playerIds?: string[]
  playersCount?: number
}

export default function Home() {
  const { status } = useSession()
  const router = useRouter()
  const [rooms, setRooms] = useState<RoomListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [openCreate, setOpenCreate] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login')
  }, [status, router])

  useEffect(() => {
    const fetchRooms = async () => {
      if (status !== 'authenticated') return
      setLoading(true)
      setError(null)
      const { data, error } = await roomHelpers.listUserRooms()
      if (error) setError(error)
      setRooms(((data as RoomData[]) || []).map((r: RoomData) => ({
        id: r.id,
        code: r.code,
        status: r.status,
        playersCount: r.playerIds?.length ?? r.playersCount ?? 0,
      })))
      setLoading(false)
    }
    fetchRooms()
  }, [status])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Loading Session</h2>
              <p className="text-gray-600">Preparing your gaming experience...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status !== 'authenticated') return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.03)_1px,transparent_0)] bg-[length:60px_60px] opacity-40"></div>
      
      <main className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Gamepad2 className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Welcome to Voting Game</h1>
            <p className="text-xl text-purple-200 max-w-2xl mx-auto">
              Create or join game rooms to compete with friends in this exciting voting-based trivia game!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={() => setOpenCreate(true)}
              size="lg"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 px-8 py-3"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Room
            </Button>
            <JoinRoomDialog>
              <Button 
                variant="outline" 
                size="lg"
                className="border-purple-300 text-purple-200 hover:bg-purple-800/20 hover:border-purple-400 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 px-8 py-3"
              >
                <Users className="w-5 h-5 mr-2" />
                Join Room
              </Button>
            </JoinRoomDialog>
          </div>

          {/* Rooms Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Crown className="w-6 h-6 text-yellow-400" />
                Your Game Rooms
              </h2>
              <div className="text-sm text-purple-200">
                {rooms.length} room{rooms.length !== 1 ? 's' : ''}
              </div>
            </div>

            {error && (
              <Card className="bg-red-50/10 backdrop-blur-sm border-red-300/30">
                <CardContent className="pt-6 text-red-300 text-sm text-center">{error}</CardContent>
              </Card>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="h-32 bg-white/10 backdrop-blur-sm border-white/20 animate-pulse" />
                ))}
              </div>
            ) : rooms.length === 0 ? (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-center">
                <CardContent className="pt-12 pb-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Gamepad2 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No Rooms Yet</h3>
                  <p className="text-purple-200 mb-6">Create your first room to start playing!</p>
                  <Button 
                    onClick={() => setOpenCreate(true)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Room
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room) => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <CreateRoomDialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreated={(room) => {
          setRooms((prev) => [{ id: room.id, code: room.code, status: 'starting', playersCount: 1 }, ...prev])
        }}
      />
    </div>
  )
}
