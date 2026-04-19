import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const revalidate = 3600 // Revalidate every hour

export async function GET() {
  try {
    const categories = await prisma.forumCategory.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { topics: true },
        },
      },
    })

    return NextResponse.json(categories, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Get categories error:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}
