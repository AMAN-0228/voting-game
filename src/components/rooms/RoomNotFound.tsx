import { AlertCircle, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RoomNotFoundScreenProps {
  roomId: string
  onGoHome: () => void
}

export function RoomNotFoundScreen({ roomId, onGoHome }: RoomNotFoundScreenProps) {
  return (
    <div className="py-12 text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <AlertCircle className="w-10 h-10 text-white" />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-3">Room Not Found</h3>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        The room you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
      </p>
      <Button
        onClick={onGoHome}
        variant="outline"
        size="lg"
        className="border-purple-200 text-purple-700 hover:bg-purple-50"
      >
        <Home className="w-4 h-4 mr-2" />
        Go Home
      </Button>
    </div>
  )
}
