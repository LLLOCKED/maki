import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { isAuthResponse, requireUser } from '@/lib/permissions'
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { randomUUID } from 'crypto'

const createReportSchema = z.object({
  targetType: z.enum(['NOVEL', 'CHAPTER', 'COMMENT', 'FORUM_COMMENT']),
  novelId: z.string().cuid().optional(),
  chapterId: z.string().cuid().optional(),
  commentId: z.string().cuid().optional(),
  forumCommentId: z.string().cuid().optional(),
  reason: z.string().trim().min(3).max(120),
  details: z.string().trim().max(2000).optional().nullable(),
})

export async function POST(request: Request) {
  const session = await requireUser()
  if (isAuthResponse(session)) return session
  const limit = rateLimit({
    key: `report:${session.user.id}`,
    limit: 10,
    windowMs: 60 * 60 * 1000,
  })
  if (!limit.success) {
    return rateLimitResponse(limit, 'Ви надсилаєте скарги занадто часто. Спробуйте пізніше.')
  }

  try {
    const parsed = createReportSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некоректні дані скарги' }, { status: 400 })
    }

    const { targetType, novelId, chapterId, commentId, forumCommentId, reason, details } = parsed.data

    if (targetType === 'NOVEL' && !novelId) {
      return NextResponse.json({ error: 'Не вказано тайтл' }, { status: 400 })
    }

    if (targetType === 'CHAPTER' && !chapterId) {
      return NextResponse.json({ error: 'Не вказано розділ' }, { status: 400 })
    }

    if (targetType === 'COMMENT' && !commentId) {
      return NextResponse.json({ error: 'Не вказано коментар' }, { status: 400 })
    }

    if (targetType === 'FORUM_COMMENT' && !forumCommentId) {
      return NextResponse.json({ error: 'Не вказано коментар' }, { status: 400 })
    }

    if (targetType === 'NOVEL') {
      const novel = await prisma.novel.findUnique({
        where: { id: novelId },
        select: { id: true },
      })
      if (!novel) return NextResponse.json({ error: 'Тайтл не знайдено' }, { status: 404 })
    }

    if (targetType === 'CHAPTER') {
      const chapter = await prisma.chapter.findUnique({
        where: { id: chapterId },
        select: { id: true, novelId: true },
      })
      if (!chapter) return NextResponse.json({ error: 'Розділ не знайдено' }, { status: 404 })
    }

    if (targetType === 'COMMENT') {
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: { id: true },
      })
      if (!comment) return NextResponse.json({ error: 'Коментар не знайдено' }, { status: 404 })
    }

    if (targetType === 'FORUM_COMMENT') {
      const comment = await prisma.forumComment.findUnique({
        where: { id: forumCommentId },
        select: { id: true },
      })
      if (!comment) return NextResponse.json({ error: 'Коментар не знайдено' }, { status: 404 })
    }

    if (targetType === 'COMMENT') {
      const [report] = await prisma.$queryRaw<{ id: string }[]>`
        INSERT INTO "ContentReport" ("id", "targetType", "reason", "details", "status", "userId", "commentId", "createdAt", "updatedAt")
        VALUES (${randomUUID()}, 'COMMENT'::"ReportTargetType", ${reason}, ${details || null}, 'OPEN'::"ReportStatus", ${session.user.id}, ${commentId}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING "id"
      `
      return NextResponse.json(report, { status: 201 })
    }

    if (targetType === 'FORUM_COMMENT') {
      const [report] = await prisma.$queryRaw<{ id: string }[]>`
        INSERT INTO "ContentReport" ("id", "targetType", "reason", "details", "status", "userId", "forumCommentId", "createdAt", "updatedAt")
        VALUES (${randomUUID()}, 'FORUM_COMMENT'::"ReportTargetType", ${reason}, ${details || null}, 'OPEN'::"ReportStatus", ${session.user.id}, ${forumCommentId}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING "id"
      `
      return NextResponse.json(report, { status: 201 })
    }

    const report = await prisma.contentReport.create({
      data: {
        targetType,
        reason,
        details: details || null,
        userId: session.user.id,
        novelId: targetType === 'NOVEL' ? novelId : null,
        chapterId: targetType === 'CHAPTER' ? chapterId : null,
      },
    })

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    console.error('Create report error:', error)
    return NextResponse.json({ error: 'Не вдалось створити скаргу' }, { status: 500 })
  }
}
