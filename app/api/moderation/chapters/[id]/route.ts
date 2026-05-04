import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthResponse, requireAdmin } from '@/lib/permissions'
import { isValidationResponse, moderationActionSchema, parseJsonBody } from '@/lib/validation'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (isAuthResponse(session)) return session

  const { id } = await params

  try {
    const body = await parseJsonBody(request, moderationActionSchema)
    if (isValidationResponse(body)) return body
    const { action } = body

    const chapter = await prisma.chapter.update({
      where: { id },
      data: {
        moderationStatus: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      },
      include: {
        novel: { select: { authorId: true, type: true } },
        team: { include: { members: { select: { userId: true } } } }
      }
    })

    // Logic: 
    // 1. If ORIGINAL, notify novel author.
    // 2. If translated, notify ONLY the team members who work on this novel/team.
    let userIdsToNotify: string[] = []

    if (chapter.novel.type === 'ORIGINAL' && chapter.novel.authorId) {
      userIdsToNotify = [chapter.novel.authorId]
    } else if (chapter.team) {
      // Notify team members
      userIdsToNotify = chapter.team.members.map(m => m.userId)
    }

    if (userIdsToNotify.length > 0) {
      await prisma.notification.createMany({
        data: userIdsToNotify.map(userId => ({
          userId,
          type: action === 'APPROVE' ? 'CHAPTER_APPROVED' : 'CHAPTER_REJECTED',
          novelId: chapter.novelId,
          chapterId: chapter.id,
        }))
      })
    }

    // Log admin action
    await prisma.adminActivityLog.create({
      data: {
        userId: session.user.id,
        action: action === 'APPROVE' ? 'APPROVE_CHAPTER' : 'REJECT_CHAPTER',
        targetId: id,
        targetType: 'chapter',
      },
    })

    return NextResponse.json(chapter)
  } catch (error) {
    console.error('Moderate chapter error:', error)
    return NextResponse.json({ error: 'Failed to moderate chapter' }, { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (isAuthResponse(session)) return session

  const { id } = await params

  try {
    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: {
        novel: {
          select: { id: true, title: true, slug: true },
        },
        team: {
          select: { id: true, name: true },
        },
      },
    })

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    return NextResponse.json(chapter)
  } catch (error) {
    console.error('Get chapter error:', error)
    return NextResponse.json({ error: 'Failed to get chapter' }, { status: 500 })
  }
}
