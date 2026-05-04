import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthResponse, requireUser } from '@/lib/permissions'
import { forumCommentSchema, isValidationResponse, parseJsonBody } from '@/lib/validation'
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await requireUser()
  if (isAuthResponse(session)) return session
  const limit = rateLimit({
    key: `forum-comment:${session.user.id}`,
    limit: 8,
    windowMs: 60 * 1000,
  })
  if (!limit.success) {
    return rateLimitResponse(limit, 'Ви надсилаєте коментарі занадто часто. Спробуйте трохи пізніше.')
  }

  try {
    const topicId = id
    const body = await parseJsonBody(request, forumCommentSchema)
    if (isValidationResponse(body)) return body
    const { content, parentId } = body

    // Check if topic exists
    const topic = await prisma.forumTopic.findUnique({
      where: { id: topicId },
    })

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
    }

    // If parentId is provided, check that parent comment exists
    if (parentId) {
      const parentComment = await prisma.forumComment.findUnique({
        where: { id: parentId },
      })
      if (!parentComment) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 })
      }
    }

    const comment = await prisma.forumComment.create({
      data: {
        content,
        userId: session.user.id,
        topicId,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true, lastSeen: true },
        },
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Create comment error:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}
