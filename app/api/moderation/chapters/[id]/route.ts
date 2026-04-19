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

  const role = (session as {user:{role?:string}}).user?.role
  if (!['OWNER', 'ADMIN', 'MODERATOR'].includes(role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  try {
    const { action } = await request.json()

    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const chapter = await prisma.chapter.update({
      where: { id },
      data: {
        moderationStatus: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
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
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const role = (session as {user:{role?:string}}).user?.role
  if (!['OWNER', 'ADMIN', 'MODERATOR'].includes(role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

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