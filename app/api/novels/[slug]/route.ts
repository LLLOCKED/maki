import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { deleteFromFTP } from '@/lib/ftp'

function extractFTPCoverPath(url: string): { filename: string; folder: string } | null {
  if (!url || !url.includes('edge-drive.cdn.express')) return null
  const match = url.match(/\/novels\/.+\/(.+)$/)
  if (!match) return null
  const parts = url.split('/')
  const folder = parts.slice(-2, -1)[0] // novels/{novelId}
  return { filename: match[1], folder }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  try {
    const novel = await prisma.novel.findUnique({
      where: { slug },
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const role = (session as {user:{role?:string}}).user?.role
  if (!['OWNER', 'ADMIN', 'MODERATOR'].includes(role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { slug } = await params

  try {
    const body = await request.json()
    const {
      title,
      originalName,
      description,
      coverUrl,
      type,
      status,
      translationStatus,
      releaseYear,
      sourceUrl,
      isExplicit,
      donationUrl,
      genreIds,
      tagIds,
      publisherIds,
      authorIds,
    } = body

    // Build update data
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (originalName !== undefined) updateData.originalName = originalName || null
    if (description !== undefined) updateData.description = description
    if (type !== undefined) updateData.type = type
    if (status !== undefined) updateData.status = status
    if (translationStatus !== undefined) updateData.translationStatus = translationStatus
    if (releaseYear !== undefined) updateData.releaseYear = releaseYear ? parseInt(releaseYear) : null
    if (sourceUrl !== undefined) updateData.sourceUrl = sourceUrl || null
    if (isExplicit !== undefined) updateData.isExplicit = isExplicit
    if (donationUrl !== undefined) updateData.donationUrl = donationUrl || null

    // Get old novel for cover deletion
    const oldNovel = await prisma.novel.findUnique({ where: { slug } })
    const oldCoverUrl = oldNovel?.coverUrl || null

    // Handle cover update separately (need old URL before changing)
    if (coverUrl !== undefined) updateData.coverUrl = coverUrl

    const novel = await prisma.novel.update({
      where: { slug },
      data: updateData,
    })

    // Delete old cover if it changed and was hosted on FTP
    if (coverUrl !== undefined && coverUrl !== oldCoverUrl && oldCoverUrl) {
      const oldPath = extractFTPCoverPath(oldCoverUrl)
      if (oldPath) {
        await deleteFromFTP(oldPath.filename, oldPath.folder)
      }
    }

    // Update genres if provided
    if (genreIds !== undefined) {
      await prisma.novelGenre.deleteMany({ where: { novelId: novel.id } })
      if (genreIds.length > 0) {
        await prisma.novelGenre.createMany({
          data: genreIds.map((genreId: string) => ({
            novelId: novel.id,
            genreId,
          })),
        })
      }
    }

    // Update tags if provided
    if (tagIds !== undefined) {
      await prisma.novelTag.deleteMany({ where: { novelId: novel.id } })
      if (tagIds.length > 0) {
        await prisma.novelTag.createMany({
          data: tagIds.map((tagId: string) => ({
            novelId: novel.id,
            tagId,
          })),
        })
      }
    }

    // Update publishers if provided
    if (publisherIds !== undefined) {
      await prisma.novelPublisher.deleteMany({ where: { novelId: novel.id } })
      if (publisherIds.length > 0) {
        await prisma.novelPublisher.createMany({
          data: publisherIds.map((publisherId: string) => ({
            novelId: novel.id,
            publisherId,
          })),
        })
      }
    }

    // Update authors if provided
    if (authorIds !== undefined) {
      await prisma.novelAuthor.deleteMany({ where: { novelId: novel.id } })
      if (authorIds.length > 0) {
        await prisma.novelAuthor.createMany({
          data: authorIds.map((authorId: string) => ({
            novelId: novel.id,
            authorId,
          })),
        })
      }
    }

    // Fetch updated novel with relations
    const updatedNovel = await prisma.novel.findUnique({
      where: { id: novel.id },
      include: {
        genres: { include: { genre: true } },
        tags: { include: { tag: true } },
        publishers: { include: { publisher: true } },
        authors: { include: { author: true } },
      },
    })

    return NextResponse.json(updatedNovel)
  } catch (error) {
    console.error('Error updating novel:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
