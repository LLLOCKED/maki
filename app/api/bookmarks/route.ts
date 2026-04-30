import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthResponse, requireUser } from '@/lib/permissions'
import { bookmarkSchema, isValidationResponse, parseJsonBody } from '@/lib/validation'

export async function GET() {
  const session = await requireUser()
  if (isAuthResponse(session)) return session

  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: session.user.id },
      include: {
        novel: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverUrl: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(bookmarks)
  } catch (error) {
    console.error('Get bookmarks error:', error)
    return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await requireUser()
  if (isAuthResponse(session)) return session

  try {
    const body = await parseJsonBody(request, bookmarkSchema)
    if (isValidationResponse(body)) return body
    const { novelId, status, readingPosition } = body

    // Check if novel exists
    const novel = await prisma.novel.findUnique({
      where: { id: novelId },
    })

    if (!novel) {
      return NextResponse.json({ error: 'Novel not found' }, { status: 404 })
    }

    // Upsert bookmark
    const bookmark = await prisma.bookmark.upsert({
      where: {
        userId_novelId: {
          userId: session.user.id,
          novelId,
        },
      },
      update: {
        status,
        ...(readingPosition !== undefined && { readingPosition }),
      },
      create: {
        userId: session.user.id,
        novelId,
        status,
        readingPosition: readingPosition || null,
      },
      include: {
        novel: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverUrl: true,
          },
        },
      },
    })

    return NextResponse.json(bookmark, { status: 201 })
  } catch (error) {
    console.error('Create bookmark error:', error)
    return NextResponse.json({ error: 'Failed to create bookmark' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await requireUser()
  if (isAuthResponse(session)) return session

  try {
    const { searchParams } = new URL(request.url)
    const novelId = searchParams.get('novelId')

    if (!novelId) {
      return NextResponse.json({ error: 'novelId is required' }, { status: 400 })
    }

    await prisma.bookmark.delete({
      where: {
        userId_novelId: {
          userId: session.user.id,
          novelId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete bookmark error:', error)
    return NextResponse.json({ error: 'Failed to delete bookmark' }, { status: 500 })
  }
}
