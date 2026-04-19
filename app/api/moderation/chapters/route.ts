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
    const chapters = await prisma.chapter.findMany({
      where: { moderationStatus: 'PENDING' },
      include: {
        novel: {
          select: { id: true, title: true, slug: true },
        },
        team: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(chapters)
  } catch (error) {
    console.error('Get pending chapters error:', error)
    return NextResponse.json({ error: 'Failed to fetch chapters' }, { status: 500 })
  }
}