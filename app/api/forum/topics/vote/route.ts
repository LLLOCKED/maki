import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { topicId, value } = await request.json()

    if (!topicId || (value !== 1 && value !== -1 && value !== 0)) {
      return NextResponse.json({ error: 'Invalid vote data' }, { status: 400 })
    }

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