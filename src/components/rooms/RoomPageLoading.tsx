import { Progress } from '@/components/ui/progress'

export function RoomPageLoading() {
  return (
    <div className="text-center py-12">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-6"></div>
        <div
          className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-pink-500 rounded-full animate-spin mx-auto"
          style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
        ></div>
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading Room</h3>
      <p className="text-gray-600 mb-6">Preparing your gaming experience...</p>
      <Progress value={undefined} className="w-64 mx-auto h-2" />
    </div>
  )
}
