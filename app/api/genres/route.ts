import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const revalidate = 3600 // Revalidate every hour

export async function GET() {
  try {
    const genres = await prisma.genre.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(genres, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Error fetching genres:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
