import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: chapterId } = await params

  try {
    const { title, content } = await request.json()

    if (title === undefined && content === undefined) {
      return NextResponse.json({ error: 'Title or content required' }, { status: 400 })
    }

    // Get the chapter with team info
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        team: true,
        novel: { select: { id: true, slug: true } },
      },
    })

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    // Check if user is team member
    let isTeamMember = false
    if (chapter.teamId && session?.user?.id) {
      const membership = await prisma.teamMembership.findUnique({
        where: {
          userId_teamId: {
            userId: session.user.id,
            teamId: chapter.teamId,
          },
        },
      })
      isTeamMember = !!membership
    }

    const isAdmin = ['OWNER', 'ADMIN', 'MODERATOR'].includes((session as { user?: { role?: string } })?.user?.role || '')

    if (!isAdmin && !isTeamMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update the chapter, set back to PENDING for moderation
    const updatedChapter = await prisma.chapter.update({
      where: { id: chapterId },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        moderationStatus: 'PENDING',
      },
    })

    return NextResponse.json(updatedChapter)
  } catch (error) {
    console.error('Edit chapter error:', error)
    return NextResponse.json({ error: 'Failed to update chapter' }, { status: 500 })
  }
}