'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Gamepad2, Users, ArrowRight, Play, Clock, Trophy } from 'lucide-react'

export interface RoomListItem {
  id: string
  code: string
  status: 'starting' | 'in_progress' | 'done'
  playersCount: number
}

interface RoomCardProps {
  room: RoomListItem
}

export const RoomCard = ({ room }: RoomCardProps) => {
  const router = useRouter()
  
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'starting':
        return {
          variant: 'secondary' as const,
          icon: Clock,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        }
      case 'in_progress':
        return {
          variant: 'default' as const,
          icon: Play,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        }
      case 'done':
        return {
          variant: 'outline' as const,
          icon: Trophy,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200'
        }
      default:
        return {
          variant: 'secondary' as const,
          icon: Clock,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        }
    }
  }

  const statusConfig = getStatusConfig(room.status)
  const StatusIcon = statusConfig.icon

  return (
    <Card className="group bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardHeader className="relative z-10 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Gamepad2 className="w-5 h-5 text-white" />
          </div>
          <Badge 
            variant={statusConfig.variant}
            className={`${statusConfig.bgColor} ${statusConfig.color} ${statusConfig.borderColor} border px-3 py-1`}
          >
            <StatusIcon className="w-3 h-3 mr-1" />
            {room.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
        <CardTitle className="text-2xl font-bold text-gray-800 tracking-wider">
          {room.code}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="relative z-10 pt-0">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">
                {room.playersCount} player{room.playersCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          
          <Button 
            size="sm" 
            onClick={() => router.push(`/room/${room.id}`)}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 group-hover:shadow-2xl"
          >
            <span>Enter Room</span>
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
