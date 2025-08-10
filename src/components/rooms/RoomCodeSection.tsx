export function RoomCodeSection({ code }: { code: string }) {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-8 rounded-2xl border border-purple-100">
      <div className="text-center">
        <div className="text-sm text-purple-600 mb-3 font-medium uppercase tracking-wider">Room Code</div>
        <div className="text-6xl font-black tracking-wider text-transparent bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text font-mono mb-3">
          {code}
        </div>
        <p className="text-purple-600 text-sm font-medium">Share this code with others to join</p>
      </div>
    </div>
  )
}
