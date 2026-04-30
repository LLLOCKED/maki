import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthResponse, requireAdmin } from '@/lib/permissions'

export async function GET() {
  const session = await requireAdmin()
  if (isAuthResponse(session)) return session

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
