import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createForumTopicSchema, isValidationResponse, parseJsonBody } from '@/lib/validation'
import { isAuthResponse, requireUser } from '@/lib/permissions'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categorySlug = searchParams.get('category')

    const where = categorySlug
      ? { category: { slug: categorySlug } }
      : {}

    const topics = await prisma.forumTopic.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        category: {
          select: { id: true, name: true, slug: true, color: true },
        },
        novel: {
          select: { id: true, title: true, slug: true },
        },
        votes: {
          select: { value: true, userId: true },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(topics)
  } catch (error) {
    console.error('Get topics error:', error)
    return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await requireUser()
  if (isAuthResponse(session)) return session

  try {
    const body = await parseJsonBody(request, createForumTopicSchema)
    if (isValidationResponse(body)) return body
    const { title, content, categoryId, novelId } = body

    const topic = await prisma.forumTopic.create({
      data: {
        title,
        content,
        userId: session.user.id,
        categoryId,
        novelId: novelId || null,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        category: {
          select: { id: true, name: true, slug: true, color: true },
        },
        novel: {
          select: { id: true, title: true, slug: true },
        },
      },
    })

    return NextResponse.json(topic, { status: 201 })
  } catch (error) {
    console.error('Create topic error:', error)
    return NextResponse.json({ error: 'Failed to create topic' }, { status: 500 })
  }
}
