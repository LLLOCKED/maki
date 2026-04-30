import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthResponse, requireOwner } from '@/lib/permissions'
import { isValidationResponse, parseJsonBody, sluggedEntitySchema } from '@/lib/validation'

export async function GET() {
  try {
    const genres = await prisma.genre.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(genres)
  } catch (error) {
    console.error('Error fetching genres:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await requireOwner()
  if (isAuthResponse(session)) return session

  try {
    const body = await parseJsonBody(request, sluggedEntitySchema)
    if (isValidationResponse(body)) return body
    const { name, slug } = body

    // Generate slug from name if not provided
    const finalSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    const genre = await prisma.genre.create({
      data: {
        name,
        slug: finalSlug,
      },
    })

    return NextResponse.json(genre, { status: 201 })
  } catch (error) {
    console.error('Error creating genre:', error)
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

    await prisma.genre.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting genre:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
