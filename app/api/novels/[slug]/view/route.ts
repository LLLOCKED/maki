import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // Get IP from headers
  const forwarded = request.headers.get('x-forwarded-for')
  const ipAddress = forwarded ? forwarded.split(',')[0].trim() : 'unknown'

  // Get user if logged in
  const session = await auth()
  const userId = session?.user?.id || null

  // Check if this IP/user already viewed this novel today
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)

  const existingView = await prisma.novelView.findFirst({
    where: {
      novel: { slug },
      ipAddress,
      viewedAt: { gte: today, lt: tomorrow },
      ...(userId ? { userId } : {}),
    },
  })

  if (existingView) {
    return NextResponse.json({ message: 'Already viewed today' })
  }

  try {
    // Create view record
    const novel = await prisma.novel.findUnique({ where: { slug } })
    if (!novel) {
      return NextResponse.json({ error: 'Novel not found' }, { status: 404 })
    }

    let createdView = true
    await prisma.novelView.create({
      data: {
        novelId: novel.id,
        ipAddress,
        userId,
      },
    }).catch((e: { code?: string }) => {
      // Ignore unique constraint errors (user already viewed today)
      if (e.code !== 'P2002') throw e
      createdView = false
    })

    if (!createdView) {
      return NextResponse.json({ message: 'Already viewed today' })
    }

    // Increment view count
    const updatedNovel = await prisma.novel.update({
      where: { slug },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    })

    return NextResponse.json({ viewCount: updatedNovel.viewCount })
  } catch (error) {
    console.error('Error incrementing view count:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
