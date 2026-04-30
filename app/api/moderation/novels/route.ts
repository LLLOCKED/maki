import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthResponse, requireAdmin } from '@/lib/permissions'

export async function GET() {
  const session = await requireAdmin()
  if (isAuthResponse(session)) return session

  try {
    const novels = await prisma.novel.findMany({
      where: { moderationStatus: 'PENDING' },
      include: {
        genres: { include: { genre: true } },
        authors: { include: { author: true } },
        _count: { select: { chapters: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(novels)
  } catch (error) {
    console.error('Get pending novels error:', error)
    return NextResponse.json({ error: 'Failed to fetch novels' }, { status: 500 })
  }
}
