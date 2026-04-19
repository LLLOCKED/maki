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

    const novel = await prisma.novel.update({
      where: { id },
      data: {
        moderationStatus: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
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