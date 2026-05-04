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

    const novel = await prisma.novel.update({
      where: { id },
      data: {
        moderationStatus: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      },
    })

    // Notify submitter only about novel moderation status
    if (novel.authorId) {
      await prisma.notification.create({
        data: {
          userId: novel.authorId,
          type: action === 'APPROVE' ? 'NOVEL_APPROVED' : 'NOVEL_REJECTED',
          novelId: novel.id,
          chapterId: '',
        }
      })
    }

    // Log admin action
    await prisma.adminActivityLog.create({
      data: {
        userId: session.user.id,
        action: action === 'APPROVE' ? 'APPROVE_NOVEL' : 'REJECT_NOVEL',
        targetId: id,
        targetType: 'novel',
      },
    })

    return NextResponse.json(novel)
  } catch (error) {
    console.error('Moderate novel error:', error)
    return NextResponse.json({ error: 'Failed to moderate novel' }, { status: 500 })
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
    const novel = await prisma.novel.findUnique({
      where: { id },
      include: {
        genres: { include: { genre: true } },
        authors: { include: { author: true } },
        publishers: { include: { publisher: true } },
        tags: { include: { tag: true } },
      },
    })

    if (!novel) {
      return NextResponse.json({ error: 'Novel not found' }, { status: 404 })
    }

    return NextResponse.json(novel)
  } catch (error) {
    console.error('Get novel error:', error)
    return NextResponse.json({ error: 'Failed to get novel' }, { status: 500 })
  }
}
