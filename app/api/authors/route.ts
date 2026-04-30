import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidationResponse, namedEntitySchema, parseJsonBody } from '@/lib/validation'

export async function GET() {
  try {
    const authors = await prisma.author.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(authors)
  } catch (error) {
    console.error('Error fetching authors:', error)
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

    const author = await prisma.author.create({
      data: { name, slug },
    })

    return NextResponse.json(author, { status: 201 })
  } catch (error) {
    console.error('Error creating author:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
