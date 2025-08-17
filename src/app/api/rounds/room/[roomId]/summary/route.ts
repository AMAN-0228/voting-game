import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getRoundSummary } from '@/actions/rounds'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId } = await context.params

    // Use the action to get round summary
    const result = await getRoundSummary(roomId, session.user.id)

    if (!result.success) {
      const status = result.code === 'NOT_FOUND' ? 404 : 
                    result.code === 'FORBIDDEN' ? 403 : 500
      return NextResponse.json({ error: result.error }, { status })
    }

    return NextResponse.json({
      success: true,
      rounds: result.data
    })

  } catch (error) {
    console.error('Error fetching round summary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
