import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthResponse, requireUser } from '@/lib/permissions'
import { bookmarkPositionSchema, isValidationResponse, parseJsonBody } from '@/lib/validation'

export async function PATCH(request: Request) {
  const session = await requireUser()
  if (isAuthResponse(session)) return session

  try {
    const body = await parseJsonBody(request, bookmarkPositionSchema)
    if (isValidationResponse(body)) return body
    const { novelId, chapterNumber } = body

    // Upsert bookmark with reading position
    const bookmark = await prisma.bookmark.upsert({
      where: {
        userId_novelId: {
          userId: session.user.id,
          novelId,
        },
      },
      update: {
        readingPosition: chapterNumber,
      },
      create: {
        userId: session.user.id,
        novelId,
        status: 'reading',
        readingPosition: chapterNumber,
      },
    })

    return NextResponse.json(bookmark)
  } catch (error) {
    console.error('Update reading position error:', error)
    return NextResponse.json({ error: 'Failed to update reading position' }, { status: 500 })
  }
}
