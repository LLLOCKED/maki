import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Prisma } from '@prisma/client'
import { getOrderBySql, buildNovelWhereClause } from '@/lib/novels'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '0')
    const limit = parseInt(searchParams.get('limit') || '12')
    const skip = page * limit

    const sortBy = searchParams.get('sortBy') || 'title'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    const where = buildNovelWhereClause({
      genres: searchParams.get('genres') || undefined,
      tags: searchParams.get('tags') || undefined,
      authors: searchParams.get('authors') || undefined,
      type: searchParams.get('type') || undefined,
      status: searchParams.get('status') || undefined,
      translationStatus: searchParams.get('translationStatus') || undefined,
      yearFrom: searchParams.get('yearFrom') || undefined,
      yearTo: searchParams.get('yearTo') || undefined,
    })

    const orderBy: any = {}
    if (sortBy === 'rating') {
      orderBy.averageRating = sortOrder
    } else if (sortBy === 'views') {
      orderBy.viewCount = sortOrder
    } else if (sortBy === 'year') {
      orderBy.releaseYear = sortOrder
    } else if (sortBy === 'created') {
      orderBy.createdAt = sortOrder
    } else {
      orderBy.title = sortOrder
    }

    let novels: any[] = []
    let total = 0

    if (search) {
      const searchPattern = `%${search}%`
      const orderBySql = getOrderBySql(sortBy, sortOrder)

      const novelResults = await prisma.$queryRaw<any[]>`
        SELECT id FROM "Novel"
        WHERE "moderationStatus" = 'APPROVED'
        AND ("title" ILIKE ${searchPattern}
          OR "originalName" ILIKE ${searchPattern})
        ORDER BY ${Prisma.raw(orderBySql)}
        LIMIT ${limit} OFFSET ${skip}
      `

      const novelIds = novelResults.map(n => n.id)

      if (novelIds.length > 0) {
        const novelsWithRelations = await prisma.novel.findMany({
          where: { id: { in: novelIds } },
          include: {
            genres: { include: { genre: true } },
            authors: { include: { author: true } },
            chapters: {
              where: { moderationStatus: 'APPROVED' },
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                title: true,
                number: true,
                createdAt: true,
                teamId: true,
              },
            },
            _count: { select: { comments: true } },
          },
        })

        novels = novelIds.map(id => novelsWithRelations.find(n => n.id === id)).filter(Boolean) as any[]
      }

      const countResult = await prisma.$queryRaw<any[]>`
        SELECT COUNT(*) as cnt FROM "Novel"
        WHERE "moderationStatus" = 'APPROVED'
        AND ("title" ILIKE ${searchPattern}
          OR "originalName" ILIKE ${searchPattern})
      `
      total = Number(countResult[0]?.cnt || 0)
    } else {
      const [novelsResult, totalResult] = await Promise.all([
        prisma.novel.findMany({
          where,
          include: {
            genres: { include: { genre: true } },
            authors: { include: { author: true } },
            chapters: {
              where: { moderationStatus: 'APPROVED' },
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                title: true,
                number: true,
                createdAt: true,
                teamId: true,
              },
            },
            _count: { select: { comments: true } },
          },
          orderBy,
          skip,
          take: limit,
        }),
        prisma.novel.count({ where }),
      ])
      novels = novelsResult
      total = totalResult
    }

    return NextResponse.json({
      novels,
      hasMore: skip + novels.length < total,
      total,
    })
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
        moderationStatus: 'PENDING',
        releaseYear: releaseYear ? parseInt(releaseYear) : null,
        authorId: (type || 'ORIGINAL') === 'ORIGINAL' ? session.user.id : null,
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
