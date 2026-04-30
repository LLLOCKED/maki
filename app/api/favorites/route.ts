import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthResponse, requireUser } from '@/lib/permissions'
import { isValidationResponse, novelIdSchema, parseJsonBody } from '@/lib/validation'

export async function GET() {
  const session = await requireUser()
  if (isAuthResponse(session)) return session

  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      include: {
        novel: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(favorites)
  } catch (error) {
    console.error('Get favorites error:', error)
    return NextResponse.json({ error: 'Failed to get favorites' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await requireUser()
  if (isAuthResponse(session)) return session

  try {
    const body = await parseJsonBody(request, novelIdSchema)
    if (isValidationResponse(body)) return body
    const { novelId } = body

    // Check if novel exists
    const novel = await prisma.novel.findUnique({
      where: { id: novelId },
    })

    if (!novel) {
      return NextResponse.json({ error: 'Novel not found' }, { status: 404 })
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_novelId: {
          userId: session.user.id,
          novelId,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ message: 'Already favorited' })
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: session.user.id,
        novelId,
      },
    })

    return NextResponse.json(favorite)
  } catch (error) {
    console.error('Add favorite error:', error)
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await requireUser()
  if (isAuthResponse(session)) return session

  try {
    const { searchParams } = new URL(request.url)
    const novelId = searchParams.get('novelId')

    if (!novelId) {
      return NextResponse.json({ error: 'novelId is required' }, { status: 400 })
    }

    await prisma.favorite.delete({
      where: {
        userId_novelId: {
          userId: session.user.id,
          novelId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove favorite error:', error)
    return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 })
  }
}
