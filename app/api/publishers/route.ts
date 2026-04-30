import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidationResponse, namedEntitySchema, parseJsonBody } from '@/lib/validation'

export const revalidate = 3600

export async function GET() {
  try {
    const publishers = await prisma.publisher.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(publishers, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Error fetching publishers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request, namedEntitySchema)
    if (isValidationResponse(body)) return body
    const { name } = body

    const slug = name
      .toLowerCase()
      .replace(/[^a-zа-яё0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const publisher = await prisma.publisher.create({
      data: { name, slug },
    })

    return NextResponse.json(publisher, { status: 201 })
  } catch (error) {
    console.error('Error creating publisher:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
