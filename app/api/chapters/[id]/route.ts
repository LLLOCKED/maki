import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { id } = await params

  const userRole = (session as {user?:{role?:string}} | null)?.user?.role
  const isAdmin = ['OWNER', 'ADMIN', 'MODERATOR'].includes(userRole || '')

  try {
    const chapter = await prisma.chapter.findUnique({
      where: { id, deletedAt: null },
      include: {
        novel: {
          select: {
            slug: true,
            title: true,
          },
        },
      },
    })

    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      )
    }

    // Only admins can see non-approved chapters
    if (!isAdmin && chapter.moderationStatus !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(chapter)
  } catch (error) {
    console.error('Error fetching chapter:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const userRole = (session as { user?: { role?: string } } | null)?.user?.role
  const isAdmin = ['OWNER', 'ADMIN', 'MODERATOR'].includes(userRole || '')

  try {
    const chapter = await prisma.chapter.findUnique({
      where: { id },
      select: { teamId: true, novel: { select: { authorId: true } } },
    })

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    // Check if user has permission to delete (Admin, Team Member, or Novel Author)
    let hasPermission = isAdmin || chapter.novel.authorId === session.user.id
    if (!hasPermission && chapter.teamId) {
      const membership = await prisma.teamMembership.findUnique({
        where: { userId_teamId: { userId: session.user.id, teamId: chapter.teamId } },
      })
      hasPermission = !!membership
    }

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.chapter.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete chapter error:', error)
    return NextResponse.json({ error: 'Failed to delete chapter' }, { status: 500 })
  }
}
