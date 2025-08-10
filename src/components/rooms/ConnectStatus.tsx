import { Loader2, Wifi, WifiOff } from 'lucide-react'

interface ConnectionStatusProps {
  isConnected: boolean
  isConnecting: boolean
}

export function ConnectionStatus({ isConnected, isConnecting }: ConnectionStatusProps) {
  return (
    <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-6 rounded-xl border border-gray-200 text-center">
      <div className="flex items-center justify-center gap-3 mb-3">
        <div
          className={`w-4 h-4 rounded-full ${
            isConnected ? 'bg-green-500' : isConnecting ? 'bg-yellow-500' : 'bg-red-500'
          }`}
        />
        <span className="text-lg font-semibold text-gray-700">
          {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
        </span>
      </div>
      <div className="flex items-center justify-center gap-2 text-gray-600">
        {isConnected ? (
          <>
            <Wifi className="w-4 h-4 text-green-500" />
            <span>Real-time updates active</span>
          </>
        ) : isConnecting ? (
          <>
            <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
            <span>Establishing connection...</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-red-500" />
            <span>Connection required</span>
          </>
        )}
      </div>
    </div>
  )
}
