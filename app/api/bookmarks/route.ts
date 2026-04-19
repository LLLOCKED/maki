import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { novelId, status } = await request.json()

    if (!novelId || !status) {
      return NextResponse.json({ error: 'novelId and status are required' }, { status: 400 })
    }

    const validStatuses = ['reading', 'planned', 'completed', 'dropped']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

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
      update: { status },
      create: {
        userId: session.user.id,
        novelId,
        status,
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
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
