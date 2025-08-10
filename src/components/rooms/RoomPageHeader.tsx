import React from 'react'
import { Gamepad2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CardHeader, CardTitle } from '@/components/ui/card'

interface RoomPageHeaderProps {
  status?: string | null
}

export function RoomPageHeader({ status }: RoomPageHeaderProps) {
  return (
    <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white pb-6">
      <CardTitle className="flex items-center justify-between text-2xl">
        <span className="flex items-center gap-3">
          <Gamepad2 className="w-8 h-8" />
          Room Details
        </span>
        {status && (
          <Badge
            variant={status === 'in_progress' ? 'default' : 'secondary'}
            className="bg-white/20 text-white border-white/30 text-sm px-3 py-1"
          >
            {status.replace('_', ' ').toUpperCase()}
          </Badge>
        )}
      </CardTitle>
    </CardHeader>
  )
}
