import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthResponse, requireUser } from '@/lib/permissions'
import { z } from '@/lib/validation'

const voteSchema = z.object({
  value: z.union([z.literal(1), z.literal(0)]),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser()
  if (isAuthResponse(session)) return session
  const { id } = await params

  try {
    const parsed = voteSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некоректний голос' }, { status: 400 })
    }

    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!comment) return NextResponse.json({ error: 'Коментар не знайдено' }, { status: 404 })

    if (parsed.data.value === 0) {
      await prisma.$executeRaw`
        DELETE FROM "CommentVote"
        WHERE "userId" = ${session.user.id} AND "commentId" = ${id}
      `
    } else {
      await prisma.$executeRaw`
        INSERT INTO "CommentVote" ("id", "userId", "commentId", "value", "createdAt", "updatedAt")
        VALUES (${randomUUID()}, ${session.user.id}, ${id}, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT ("userId", "commentId")
        DO UPDATE SET "value" = 1, "updatedAt" = CURRENT_TIMESTAMP
      `
    }

    const [scoreRow] = await prisma.$queryRaw<{ score: bigint }[]>`
      SELECT COALESCE(SUM("value"), 0)::bigint as score
      FROM "CommentVote"
      WHERE "commentId" = ${id}
    `

    return NextResponse.json({
      score: Number(scoreRow?.score || 0),
      currentUserVote: parsed.data.value,
    })
  } catch (error) {
    console.error('Vote comment error:', error)
    return NextResponse.json({ error: 'Не вдалось оновити лайк' }, { status: 500 })
  }
}
