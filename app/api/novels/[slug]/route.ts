import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const novel = await prisma.novel.findUnique({
      where: { slug: params.slug },
      include: {
        genres: {
          include: {
            genre: true,
          },
        },
        publishers: {
          include: {
            publisher: true,
          },
        },
        authors: {
          include: {
            author: true,
          },
        },
        chapters: {
          orderBy: {
            number: 'asc',
          },
          select: {
            id: true,
            title: true,
            number: true,
            createdAt: true,
            teamId: true,
          },
        },
      },
    })

    if (!novel) {
      return NextResponse.json(
        { error: 'Novel not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(novel)
  } catch (error) {
    console.error('Error fetching novel:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
