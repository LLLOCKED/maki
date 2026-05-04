import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ADMIN_ROLES, isAuthResponse, requireUser } from '@/lib/permissions'
import { z } from '@/lib/validation'

const updateForumCommentSchema = z.object({
  content: z.string().trim().min(1).max(2000),
})

const COMMENT_EDIT_WINDOW_MS = 15 * 60 * 1000

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser()
  if (isAuthResponse(session)) return session
  const { id } = await params

  try {
    const parsed = updateForumCommentSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некоректний коментар' }, { status: 400 })
    }

    const comment = await prisma.forumComment.findUnique({
      where: { id },
      select: { id: true, userId: true, createdAt: true },
    })
    if (!comment) return NextResponse.json({ error: 'Коментар не знайдено' }, { status: 404 })
    if (comment.userId !== session.user.id) {
      return NextResponse.json({ error: 'Можна редагувати лише власні коментарі' }, { status: 403 })
    }
    if (Date.now() - comment.createdAt.getTime() > COMMENT_EDIT_WINDOW_MS) {
      return NextResponse.json({ error: 'Редагувати коментар можна лише протягом 15 хвилин після створення' }, { status: 403 })
    }

    const updated = await prisma.forumComment.update({
      where: { id },
      data: { content: parsed.data.content },
      include: {
        user: { select: { id: true, name: true, image: true, lastSeen: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update forum comment error:', error)
    return NextResponse.json({ error: 'Не вдалось оновити коментар' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser()
  if (isAuthResponse(session)) return session
  const { id } = await params

  try {
    const comment = await prisma.forumComment.findUnique({
      where: { id },
      select: { id: true, userId: true },
    })
    if (!comment) return NextResponse.json({ error: 'Коментар не знайдено' }, { status: 404 })
    const canModerate = Boolean(session.user.role && ADMIN_ROLES.includes(session.user.role as any))
    if (comment.userId !== session.user.id && !canModerate) {
      return NextResponse.json({ error: 'Можна видаляти лише власні коментарі' }, { status: 403 })
    }

    await prisma.forumComment.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Delete forum comment error:', error)
    return NextResponse.json({ error: 'Не вдалось видалити коментар' }, { status: 500 })
  }
}
