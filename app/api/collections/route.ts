import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { isAuthResponse, requireUser } from '@/lib/permissions'
import { collectionCreateSchema, collectionMutationSchema, isValidationResponse, parseJsonBody } from '@/lib/validation'

export async function GET(request: Request) {
  const session = await auth()
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  try {
    if (userId) {
      const collections = await prisma.collection.findMany({
        where: {
          OR: [
            { userId },
            { isPublic: true },
          ],
        },
        include: {
          _count: {
            select: { novels: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(collections)
    }

    return NextResponse.json([])
  } catch (error) {
    console.error('Collections fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await requireUser()
  if (isAuthResponse(session)) return session

  try {
    const body = await parseJsonBody(request, collectionCreateSchema)
    if (isValidationResponse(body)) return body
    const { name, isPublic } = body

    const collection = await prisma.collection.create({
      data: {
        name,
        isPublic: isPublic || false,
        userId: session.user.id,
      },
    })

    return NextResponse.json(collection, { status: 201 })
  } catch (error) {
    console.error('Collection create error:', error)
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const session = await requireUser()
  if (isAuthResponse(session)) return session

  try {
    const body = await parseJsonBody(request, collectionMutationSchema)
    if (isValidationResponse(body)) return body
    const { collectionId, novelId, action } = body

    // Verify ownership
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
    })

    if (!collection || collection.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found or not owned' }, { status: 403 })
    }

    if (action === 'add') {
      await prisma.collection.update({
        where: { id: collectionId },
        data: {
          novels: { connect: { id: novelId } },
        },
      })
    } else if (action === 'remove') {
      await prisma.collection.update({
        where: { id: collectionId },
        data: {
          novels: { disconnect: { id: novelId } },
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Collection update error:', error)
    return NextResponse.json({ error: 'Failed to update collection' }, { status: 500 })
  }
}
