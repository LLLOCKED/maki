import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createChapterSchema, isValidationResponse, parseJsonBody } from '@/lib/validation'
import { isAuthResponse, requireUser } from '@/lib/permissions'

export async function POST(request: Request) {
  const session = await requireUser()
  if (isAuthResponse(session)) return session

  try {
    const body = await parseJsonBody(request, createChapterSchema)
    if (isValidationResponse(body)) return body

    const { title, number, content, novelId, teamId, volume } = body

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
          number,
          volume: volume ?? null,
          content,
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

      const membership = await prisma.teamMembership.findUnique({
        where: {
          userId_teamId: {
            userId: session.user.id,
            teamId,
          },
        },
      })

      if (!membership) {
        return NextResponse.json(
          { error: 'Only team members can add chapters for this team' },
          { status: 403 }
        )
      }

      const chapter = await prisma.chapter.create({
        data: {
          title,
          number,
          volume: volume ?? null,
          content,
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
