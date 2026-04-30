import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthResponse, requireUser } from '@/lib/permissions'
import { isValidationResponse, parseJsonBody, ratingSchema } from '@/lib/validation'

export async function POST(request: Request) {
  const session = await requireUser()
  if (isAuthResponse(session)) return session

  try {
    const body = await parseJsonBody(request, ratingSchema)
    if (isValidationResponse(body)) return body
    const { novelId, value } = body

    // Upsert rating
    const rating = await prisma.rating.upsert({
      where: {
        userId_novelId: {
          userId: session.user.id,
          novelId,
        },
      },
      update: { value },
      create: {
        userId: session.user.id,
        novelId,
        value,
      },
    })

    // Update average rating on novel
    const avg = await prisma.rating.aggregate({
      where: { novelId },
      _avg: { value: true },
    })

    await prisma.novel.update({
      where: { id: novelId },
      data: { averageRating: avg._avg.value || 0 },
    })

    return NextResponse.json({ rating, newAverage: avg._avg.value || 0 })
  } catch (error) {
    console.error('Rating error:', error)
    return NextResponse.json({ error: 'Failed to rate' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const novelId = searchParams.get('novelId')
  const userId = searchParams.get('userId')

  try {
    if (novelId) {
      const ratings = await prisma.rating.findMany({
        where: { novelId },
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
        },
      })
      return NextResponse.json(ratings)
    }

    if (userId) {
      const ratings = await prisma.rating.findMany({
        where: { userId },
        include: {
          novel: {
            select: { id: true, slug: true, title: true, coverUrl: true },
          },
        },
      })
      return NextResponse.json(ratings)
    }

    return NextResponse.json([])
  } catch (error) {
    console.error('Rating fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch ratings' }, { status: 500 })
  }
}
