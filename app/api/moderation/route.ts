import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const role = (session as {user:{role?:string}}).user.role
  if (!['OWNER', 'ADMIN', 'MODERATOR'].includes(role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const [pendingNovels, pendingChapters, pendingTopics] = await Promise.all([
      prisma.novel.count({ where: { moderationStatus: 'PENDING' } }),
      prisma.chapter.count({ where: { moderationStatus: 'PENDING' } }),
      prisma.forumTopic.count({ where: { moderationStatus: 'PENDING' } }),
    ])

    return NextResponse.json({
      pendingNovels,
      pendingChapters,
      pendingTopics,
    })
  } catch (error) {
    console.error('Moderation stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}