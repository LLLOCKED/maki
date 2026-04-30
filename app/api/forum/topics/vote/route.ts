import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthResponse, requireUser } from '@/lib/permissions'
import { forumVoteSchema, isValidationResponse, parseJsonBody } from '@/lib/validation'

export async function POST(request: Request) {
  const session = await requireUser()
  if (isAuthResponse(session)) return session

  try {
    const body = await parseJsonBody(request, forumVoteSchema)
    if (isValidationResponse(body)) return body
    const { topicId, value } = body

    if (value === 0) {
      // Remove vote
      await prisma.forumTopicVote.deleteMany({
        where: {
          userId: session.user.id,
          topicId,
        },
      })
      return NextResponse.json({ success: true, vote: null })
    }

    // Upsert vote
    const vote = await prisma.forumTopicVote.upsert({
      where: {
        userId_topicId: {
          userId: session.user.id,
          topicId,
        },
      },
      update: { value },
      create: {
        userId: session.user.id,
        topicId,
        value,
      },
    })

    return NextResponse.json({ success: true, vote })
  } catch (error) {
    console.error('Vote error:', error)
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 })
  }
}
