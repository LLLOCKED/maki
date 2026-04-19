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