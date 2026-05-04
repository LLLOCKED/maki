import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createCommentSchema, isValidationResponse, parseJsonBody } from '@/lib/validation'
import { isAuthResponse, requireUser } from '@/lib/permissions'
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'

type CommentWithReplies = {
  id: string
  replies?: CommentWithReplies[]
  score?: number
  currentUserVote?: number
}

function collectCommentIds(comments: CommentWithReplies[]): string[] {
  return comments.flatMap((comment) => [
    comment.id,
    ...collectCommentIds(comment.replies || []),
  ])
}

function attachVoteMeta<T extends CommentWithReplies>(
  comments: T[],
  scores: Map<string, number>,
  userVotes: Map<string, number>
): T[] {
  return comments.map((comment) => ({
    ...comment,
    score: scores.get(comment.id) || 0,
    currentUserVote: userVotes.get(comment.id) || 0,
    replies: attachVoteMeta(comment.replies || [], scores, userVotes),
  }))
}

export async function GET(request: Request) {
  const session = await auth()
  const { searchParams } = new URL(request.url)
  const novelId = searchParams.get('novelId')
  const chapterId = searchParams.get('chapterId')
  const sort = searchParams.get('sort') === 'oldest' ? 'asc' : 'desc'

  try {
    const where = novelId ? { novelId } : chapterId ? { chapterId } : {}

    const comments = await prisma.comment.findMany({
      where: { ...where, parentId: null },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            lastSeen: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                lastSeen: true,
              },
            },
            replies: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                    lastSeen: true,
                  },
                },
                replies: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        image: true,
                        lastSeen: true,
                      },
                    },
                    replies: {
                      include: {
                        user: {
                          select: {
                            id: true,
                            name: true,
                            image: true,
                            lastSeen: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: sort,
      },
    })

    const ids = collectCommentIds(comments)
    const scoreRows = ids.length > 0
      ? await prisma.$queryRaw<{ commentId: string; score: bigint }[]>`
          SELECT "commentId", COALESCE(SUM("value"), 0)::bigint as score
          FROM "CommentVote"
          WHERE "commentId" = ANY(${ids})
          GROUP BY "commentId"
        `
      : []
    const voteRows = session?.user?.id && ids.length > 0
      ? await prisma.$queryRaw<{ commentId: string; value: number }[]>`
          SELECT "commentId", "value"
          FROM "CommentVote"
          WHERE "userId" = ${session.user.id} AND "commentId" = ANY(${ids})
        `
      : []

    const scores = new Map(scoreRows.map((row) => [row.commentId, Number(row.score)]))
    const userVotes = new Map(voteRows.map((row) => [row.commentId, row.value]))

    return NextResponse.json(attachVoteMeta(comments, scores, userVotes))
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await requireUser()
  if (isAuthResponse(session)) return session
  const limit = rateLimit({
    key: `comment:${session.user.id}`,
    limit: 8,
    windowMs: 60 * 1000,
  })
  if (!limit.success) {
    return rateLimitResponse(limit, 'Ви надсилаєте коментарі занадто часто. Спробуйте трохи пізніше.')
  }

  try {
    const body = await parseJsonBody(request, createCommentSchema)
    if (isValidationResponse(body)) return body

    const { content, novelId, chapterId, parentId } = body

    // If parentId is provided, check that parent comment exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      })
      if (!parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        )
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        userId: session.user.id,
        novelId: novelId || null,
        chapterId: chapterId || null,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            lastSeen: true,
          },
        },
        parent: { select: { userId: true } }
      },
    })

    // Notify parent comment author if it's a reply
    if (parentId && comment.parent && comment.parent.userId !== session.user.id) {
      await prisma.notification.create({
        data: {
          userId: comment.parent.userId,
          type: 'COMMENT_REPLY',
          novelId: novelId || '',
          chapterId: chapterId || '',
        }
      })
    }

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
