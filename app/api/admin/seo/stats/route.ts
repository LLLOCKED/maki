import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthResponse, requireAdmin } from '@/lib/permissions'

export async function GET(req: Request) {
  const session = await requireAdmin()
  if (isAuthResponse(session)) return session

  try {
    const [
      totalNovels,
      pendingNovels,
      allNovels,
      noCoverNovels,
    ] = await Promise.all([
      prisma.novel.count(),
      prisma.novel.count({ where: { moderationStatus: 'PENDING' } }),
      prisma.novel.findMany({
        where: { moderationStatus: 'APPROVED' },
        select: { viewCount: true, averageRating: true },
      }),
      prisma.novel.count({ where: { moderationStatus: 'APPROVED', coverUrl: null } }),
    ])

    const noCoverCount = noCoverNovels
    const lowRatingCount = allNovels.filter((n) => n.averageRating < 3 && n.averageRating > 0).length
    const totalViews = allNovels.reduce((sum, n) => sum + n.viewCount, 0)
    const avgRating = allNovels.length > 0
      ? allNovels.reduce((sum, n) => sum + n.averageRating, 0) / allNovels.length
      : 0

    return NextResponse.json({
      totalNovels,
      pendingNovels,
      totalViews,
      avgRating,
      noCoverCount,
      lowRatingCount,
    })
  } catch (error) {
    console.error('Error fetching SEO stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
