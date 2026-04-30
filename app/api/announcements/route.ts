import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthResponse, requireAdmin } from '@/lib/permissions'
import { announcementSchema, isValidationResponse, parseJsonBody } from '@/lib/validation'

export async function GET() {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json(announcements)
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await requireAdmin()
  if (isAuthResponse(session)) return session

  try {
    const body = await parseJsonBody(request, announcementSchema)
    if (isValidationResponse(body)) return body
    const { title, description, posterUrl, linkUrl, linkType, tag, sortOrder, isActive } = body

    const announcement = await prisma.announcement.create({
      data: {
        title,
        description,
        posterUrl,
        linkUrl,
        linkType,
        tag,
        isActive,
        sortOrder,
      },
    })

    return NextResponse.json(announcement, { status: 201 })
  } catch (error) {
    console.error('Error creating announcement:', error)
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}
