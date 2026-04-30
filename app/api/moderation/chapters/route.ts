import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthResponse, requireAdmin } from '@/lib/permissions'

export async function GET() {
  const session = await requireAdmin()
  if (isAuthResponse(session)) return session

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
