import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const revalidate = 3600

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(tags, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Tags fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-zа-яё0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const tag = await prisma.tag.create({
      data: { name, slug },
    })

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error('Tag create error:', error)
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
  }
}
