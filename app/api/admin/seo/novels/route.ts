import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthResponse, requireAdmin } from '@/lib/permissions'

export async function GET(req: Request) {
  const session = await requireAdmin()
  if (isAuthResponse(session)) return session

  try {
    const { searchParams } = new URL(req.url)
    const tab = searchParams.get('tab') || 'pending'
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}

    switch (tab) {
      case 'pending':
        where.moderationStatus = 'PENDING'
        break
      case 'no-cover':
        where.coverUrl = null
        break
      case 'low-rating':
        where.averageRating = { lt: 3, gt: 0 }
        break
      case 'all':
        break
      default:
        where.moderationStatus = 'PENDING'
    }

    const novels = await prisma.novel.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        coverUrl: true,
        viewCount: true,
        averageRating: true,
        moderationStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ novels })
  } catch (error) {
    console.error('Error fetching novels for SEO:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
