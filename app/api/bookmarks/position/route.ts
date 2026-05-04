import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthResponse, requireUser } from '@/lib/permissions'
import { bookmarkPositionSchema, isValidationResponse, parseJsonBody } from '@/lib/validation'
import { randomUUID } from 'crypto'

export async function PATCH(request: Request) {
  const session = await requireUser()
  if (isAuthResponse(session)) return session

  try {
    const body = await parseJsonBody(request, bookmarkPositionSchema)
    if (isValidationResponse(body)) return body
    const { novelId, chapterNumber, progress = 0 } = body

    const [bookmark] = await prisma.$queryRaw<{ id: string; readingPosition: number; readingProgress: number }[]>`
      INSERT INTO "Bookmark" ("id", "userId", "novelId", "status", "readingPosition", "readingProgress", "createdAt", "updatedAt")
      VALUES (${randomUUID()}, ${session.user.id}, ${novelId}, 'reading'::"BookmarkStatus", ${chapterNumber}, ${progress}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("userId", "novelId")
      DO UPDATE SET "readingPosition" = ${chapterNumber}, "readingProgress" = ${progress}, "updatedAt" = CURRENT_TIMESTAMP
      RETURNING "id", "readingPosition", "readingProgress"
    `

    return NextResponse.json(bookmark)
  } catch (error) {
    console.error('Update reading position error:', error)
    return NextResponse.json({ error: 'Failed to update reading position' }, { status: 500 })
  }
}
