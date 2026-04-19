import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const publishers = await prisma.publisher.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(publishers)
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
    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const publisher = await prisma.publisher.create({
      data: { name },
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
