import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthResponse, requireAdmin } from '@/lib/permissions'
import { announcementSchema, isValidationResponse, parseJsonBody } from '@/lib/validation'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const announcement = await prisma.announcement.findUnique({ where: { id } })
    if (!announcement) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(announcement)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (isAuthResponse(session)) return session

  const { id } = await params
  try {
    const body = await parseJsonBody(request, announcementSchema.partial())
    if (isValidationResponse(body)) return body
    const { title, description, posterUrl, linkUrl, linkType, tag, sortOrder, isActive } = body

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(posterUrl !== undefined && { posterUrl }),
        ...(linkUrl !== undefined && { linkUrl }),
        ...(linkType !== undefined && { linkType }),
        ...(tag !== undefined && { tag }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json(announcement)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (isAuthResponse(session)) return session

  const { id } = await params
  try {
    await prisma.announcement.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
