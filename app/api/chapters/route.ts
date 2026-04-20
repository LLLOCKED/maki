import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

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
    const { title, number, content, novelId, teamId } = body

    if (!title || !number || !novelId) {
      return NextResponse.json(
        { error: 'Title, number and novelId are required' },
        { status: 400 }
      )
    }

    // Get the novel to check its type
    const novel = await prisma.novel.findUnique({
      where: { id: novelId },
      select: { id: true, type: true, authorId: true },
    })

    if (!novel) {
      return NextResponse.json(
        { error: 'Novel not found' },
        { status: 404 }
      )
    }

    // Check permissions based on novel type
    if (novel.type === 'ORIGINAL') {
      // Only the author can add chapters to original novels
      if (novel.authorId !== session.user.id) {
        return NextResponse.json(
          { error: 'Only the author can add chapters to this novel' },
          { status: 403 }
        )
      }
      // Original novels don't use teams - no teamId needed
      const chapter = await prisma.chapter.create({
        data: {
          title,
          number: parseInt(number),
          content: content || '',
          novelId,
          teamId: null, // No team for original novels
          moderationStatus: 'PENDING',
        },
        include: {
          novel: {
            select: {
              slug: true,
            },
          },
        },
      })
      return NextResponse.json(chapter, { status: 201 })
    } else {
      // For translated novels - team is required but any registered user can add
      if (!teamId) {
        return NextResponse.json(
          { error: 'Team is required for translated novels' },
          { status: 400 }
        )
      }
      // Any registered user can add chapters to translated novels under a team

      const chapter = await prisma.chapter.create({
        data: {
          title,
          number: parseInt(number),
          content: content || '',
          novelId,
          teamId,
          moderationStatus: 'PENDING',
        },
        include: {
          novel: {
            select: {
              slug: true,
            },
          },
        },
      })
      return NextResponse.json(chapter, { status: 201 })
    }
  } catch (error) {
    console.error('Error creating chapter:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
