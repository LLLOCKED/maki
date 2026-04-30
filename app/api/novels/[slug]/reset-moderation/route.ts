import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { slug } = await params

  try {
    // Check if user is admin (OWNER or ADMIN only)
    const isAdmin = ['OWNER', 'ADMIN'].includes((session as any).user?.role || '')

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Reset moderation status to PENDING
    const updated = await prisma.novel.update({
      where: { slug },
      data: {
        moderationStatus: 'PENDING',
      },
    })

    // Log admin action
    await prisma.adminActivityLog.create({
      data: {
        userId: session.user.id,
        action: 'RESET_MODERATION',
        targetId: updated.id,
        targetType: 'novel',
        details: JSON.stringify({ title: updated.title }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Reset moderation error:', error)
    return NextResponse.json({ error: 'Failed to reset moderation' }, { status: 500 })
  }
}