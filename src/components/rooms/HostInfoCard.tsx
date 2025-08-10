import { Crown } from 'lucide-react'

interface HostInfoCardProps {
  name?: string | null
  email?: string | null
}

export function HostInfoCard({ name, email }: HostInfoCardProps) {
  return (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-100">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
          <Crown className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-sm text-emerald-600 font-medium uppercase tracking-wider">Host</div>
          <div className="font-bold text-lg text-gray-800">{name || email || '—'}</div>
        </div>
      </div>
    </div>
  )
}
