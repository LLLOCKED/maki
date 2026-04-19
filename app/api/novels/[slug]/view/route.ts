import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const novel = await prisma.novel.update({
      where: { slug: params.slug },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    })

    return NextResponse.json({ viewCount: novel.viewCount })
  } catch (error) {
    console.error('Error incrementing view count:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
