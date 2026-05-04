import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { isAuthResponse, requireAdmin } from '@/lib/permissions'

const updateReportSchema = z.object({
  id: z.string().cuid(),
  status: z.enum(['OPEN', 'REVIEWED', 'DISMISSED']),
})

export async function GET(request: Request) {
  const session = await requireAdmin()
  if (isAuthResponse(session)) return session

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const statusWhere = status && status !== 'all' ? status : null

  const rows = await prisma.$queryRaw<{
    id: string
    targetType: string
    reason: string
    details: string | null
    status: string
    createdAt: Date
    resolvedAt: Date | null
    userId: string
    userName: string | null
    userEmail: string | null
    resolverId: string | null
    resolverName: string | null
    novelId: string | null
    novelTitle: string | null
    novelSlug: string | null
    chapterId: string | null
    chapterTitle: string | null
    chapterNumber: number | null
    chapterVolume: number | null
    chapterNovelTitle: string | null
    chapterNovelSlug: string | null
    chapterTeamSlug: string | null
    chapterTeamName: string | null
    commentId: string | null
    commentContent: string | null
    commentNovelSlug: string | null
    commentChapterNumber: number | null
    forumCommentId: string | null
    forumCommentContent: string | null
    forumTopicId: string | null
    forumTopicTitle: string | null
  }[]>`
    SELECT
      r."id",
      r."targetType"::text as "targetType",
      r."reason",
      r."details",
      r."status"::text as "status",
      r."createdAt",
      r."resolvedAt",
      u."id" as "userId",
      u."name" as "userName",
      u."email" as "userEmail",
      resolver."id" as "resolverId",
      resolver."name" as "resolverName",
      n."id" as "novelId",
      n."title" as "novelTitle",
      n."slug" as "novelSlug",
      ch."id" as "chapterId",
      ch."title" as "chapterTitle",
      ch."number" as "chapterNumber",
      ch."volume" as "chapterVolume",
      chNovel."title" as "chapterNovelTitle",
      chNovel."slug" as "chapterNovelSlug",
      chTeam."slug" as "chapterTeamSlug",
      chTeam."name" as "chapterTeamName",
      c."id" as "commentId",
      c."content" as "commentContent",
      cNovel."slug" as "commentNovelSlug",
      cChapter."number" as "commentChapterNumber",
      fc."id" as "forumCommentId",
      fc."content" as "forumCommentContent",
      ft."id" as "forumTopicId",
      ft."title" as "forumTopicTitle"
    FROM "ContentReport" r
    JOIN "User" u ON u."id" = r."userId"
    LEFT JOIN "User" resolver ON resolver."id" = r."resolvedBy"
    LEFT JOIN "Novel" n ON n."id" = r."novelId"
    LEFT JOIN "Chapter" ch ON ch."id" = r."chapterId"
    LEFT JOIN "Novel" chNovel ON chNovel."id" = ch."novelId"
    LEFT JOIN "Team" chTeam ON chTeam."id" = ch."teamId"
    LEFT JOIN "Comment" c ON c."id" = r."commentId"
    LEFT JOIN "Novel" cNovel ON cNovel."id" = c."novelId"
    LEFT JOIN "Chapter" cChapter ON cChapter."id" = c."chapterId"
    LEFT JOIN "ForumComment" fc ON fc."id" = r."forumCommentId"
    LEFT JOIN "ForumTopic" ft ON ft."id" = fc."topicId"
    WHERE (${statusWhere}::text IS NULL OR r."status"::text = ${statusWhere})
    ORDER BY r."createdAt" DESC
    LIMIT 100
  `

  const reports = rows.map((row) => ({
    id: row.id,
    targetType: row.targetType,
    reason: row.reason,
    details: row.details,
    status: row.status,
    createdAt: row.createdAt,
    resolvedAt: row.resolvedAt,
    user: { id: row.userId, name: row.userName, email: row.userEmail },
    resolver: row.resolverId ? { id: row.resolverId, name: row.resolverName } : null,
    novel: row.novelId ? { id: row.novelId, title: row.novelTitle, slug: row.novelSlug } : null,
    chapter: row.chapterId ? {
      id: row.chapterId,
      title: row.chapterTitle,
      number: row.chapterNumber,
      volume: row.chapterVolume,
      novel: { title: row.chapterNovelTitle, slug: row.chapterNovelSlug },
      team: row.chapterTeamSlug ? { slug: row.chapterTeamSlug, name: row.chapterTeamName } : null,
    } : null,
    comment: row.commentId ? {
      id: row.commentId,
      content: row.commentContent,
      novelSlug: row.commentNovelSlug,
      chapterNumber: row.commentChapterNumber,
    } : null,
    forumComment: row.forumCommentId ? {
      id: row.forumCommentId,
      content: row.forumCommentContent,
      topic: row.forumTopicId ? { id: row.forumTopicId, title: row.forumTopicTitle } : null,
    } : null,
  }))

  return NextResponse.json(reports)
}

export async function PATCH(request: Request) {
  const session = await requireAdmin()
  if (isAuthResponse(session)) return session

  try {
    const parsed = updateReportSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некоректні дані' }, { status: 400 })
    }

    const { id, status } = parsed.data
    const report = await prisma.contentReport.update({
      where: { id },
      data: {
        status,
        resolvedAt: status === 'OPEN' ? null : new Date(),
        resolvedBy: status === 'OPEN' ? null : session.user.id,
      },
    })

    return NextResponse.json(report)
  } catch (error) {
    console.error('Update report error:', error)
    return NextResponse.json({ error: 'Не вдалось оновити скаргу' }, { status: 500 })
  }
}
