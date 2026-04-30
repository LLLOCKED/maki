import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Get novel to check ownership
    const novel = await prisma.novel.findUnique({
      where: { id },
      select: { authorId: true, type: true },
    })

    if (!novel) {
      return NextResponse.json({ error: 'Novel not found' }, { status: 404 })
    }

    // Check if user is admin (OWNER or ADMIN only)
    const isAdmin = ['OWNER', 'ADMIN'].includes((session as any).user?.role || '')

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Reset moderation status to PENDING
    const updated = await prisma.novel.update({
      where: { id },
      data: {
        moderationStatus: 'PENDING',
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Reset moderation error:', error)
    return NextResponse.json({ error: 'Failed to reset moderation' }, { status: 500 })
  }
}