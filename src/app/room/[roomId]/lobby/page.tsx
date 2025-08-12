import { RoomLobby } from '@/components/rooms/RoomLobby'

interface LobbyPageProps {
  params: Promise<{ roomId: string }>
}

export default async function LobbyPage({ params }: LobbyPageProps) {
  const { roomId } = await params
  return (
    <main className="p-4">
      <RoomLobby roomId={roomId} />
    </main>
  )
}
