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

  const role = (session as { user: { role?: string } }).user?.role
  if (!['OWNER', 'ADMIN', 'MODERATOR'].includes(role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id: chapterId } = await params

  try {
    // Get the chapter with novel info
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        novel: { select: { id: true, title: true, slug: true } },
        team: { select: { id: true, name: true } },
      },
    })

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    if (chapter.moderationStatus === 'APPROVED') {
      return NextResponse.json({ error: 'Chapter already approved' }, { status: 400 })
    }

    // Approve the chapter
    await prisma.chapter.update({
      where: { id: chapterId },
      data: { moderationStatus: 'APPROVED' },
    })

    // Create notifications for eligible users
    const [bookmarkUsers, favoriteUsers] = await Promise.all([
      prisma.bookmark.findMany({
        where: { novelId: chapter.novelId, status: { in: ['reading', 'planned'] } },
        select: { userId: true },
      }),
      prisma.favorite.findMany({
        where: { novelId: chapter.novelId },
        select: { userId: true },
      }),
    ])

    // Deduplicate and exclude chapter author (if logged in)
    const userIds = [...new Set([
      ...bookmarkUsers.map(b => b.userId),
      ...favoriteUsers.map(f => f.userId),
    ])].filter(id => id !== session.user.id)

    if (userIds.length > 0) {
      await prisma.notification.createMany({
        data: userIds.map(userId => ({
          userId,
          type: 'NEW_CHAPTER',
          novelId: chapter.novelId,
          chapterId: chapter.id,
          teamId: chapter.teamId,
        })),
      })
    }

    return NextResponse.json({ success: true, notificationsCreated: userIds.length })
  } catch (error) {
    console.error('Approve chapter error:', error)
    return NextResponse.json({ error: 'Failed to approve chapter' }, { status: 500 })
  }
}