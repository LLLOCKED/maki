import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const novels = await prisma.novel.findMany({
      include: {
        genres: {
          include: {
            genre: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            chapters: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(novels)
  } catch (error) {
    console.error('Error fetching novels:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const {
      title,
      originalName,
      slug,
      description,
      coverUrl,
      type,
      status,
      translationStatus,
      releaseYear,
      genreIds,
      tagIds,
      publisherIds,
      authorIds,
    } = body

    if (!title || !slug || !description) {
      return NextResponse.json(
        { error: 'Title, slug and description are required' },
        { status: 400 }
      )
    }

    const novel = await prisma.novel.create({
      data: {
        title,
        originalName: originalName || null,
        slug,
        description,
        coverUrl: coverUrl || null,
        type: type || 'ORIGINAL',
        status: status || 'ONGOING',
        translationStatus: translationStatus || 'TRANSLATING',
        releaseYear: releaseYear ? parseInt(releaseYear) : null,
        genres: genreIds?.length
          ? {
              create: genreIds.map((genreId: string) => ({
                genre: { connect: { id: genreId } },
              })),
            }
          : undefined,
        tags: tagIds?.length
          ? {
              create: tagIds.map((tagId: string) => ({
                tag: { connect: { id: tagId } },
              })),
            }
          : undefined,
        publishers: publisherIds?.length
          ? {
              create: publisherIds.map((publisherId: string) => ({
                publisher: { connect: { id: publisherId } },
              })),
            }
          : undefined,
        authors: authorIds?.length
          ? {
              create: authorIds.map((authorId: string) => ({
                author: { connect: { id: authorId } },
              })),
            }
          : undefined,
      },
      include: {
        genres: {
          include: { genre: true },
        },
        publishers: {
          include: { publisher: true },
        },
        authors: {
          include: { author: true },
        },
      },
    })

    return NextResponse.json(novel, { status: 201 })
  } catch (error) {
    console.error('Error creating novel:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
