import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthResponse, requireOwner } from '@/lib/permissions'
import { forumCategorySchema, isValidationResponse, parseJsonBody } from '@/lib/validation'

export async function GET() {
  try {
    const categories = await prisma.forumCategory.findMany({
      orderBy: { order: 'asc' },
    })
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching forum categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await requireOwner()
  if (isAuthResponse(session)) return session

  try {
    const body = await parseJsonBody(request, forumCategorySchema)
    if (isValidationResponse(body)) return body
    const { name, slug, description, color, order } = body

    const category = await prisma.forumCategory.create({
      data: {
        name,
        slug,
        description,
        color,
        order,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating forum category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await requireOwner()
  if (isAuthResponse(session)) return session

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    await prisma.forumCategory.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting forum category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
