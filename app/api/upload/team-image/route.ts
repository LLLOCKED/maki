import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadToStorage, deleteFromStorage } from '@/lib/storage'
import { isAuthResponse, requireUser } from '@/lib/permissions'
import { prepareImageUpload } from '@/lib/image-upload'
import { randomUUID } from 'crypto'
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit'

function extractR2Path(url: string): string | null {
  if (!url || !url.includes('cdn.honni.fun')) return null
  return url.split('/').slice(-2).join('/') // teams/{teamId}/{filename}
}

export async function POST(request: Request) {
  try {
    const session = await requireUser()
    if (isAuthResponse(session)) return session

    const userId = session.user.id
    const limit = rateLimit({
      key: `upload-team-image:${userId}`,
      limit: 12,
      windowMs: 60 * 60 * 1000,
    })
    if (!limit.success) {
      return rateLimitResponse(limit, 'Ви завантажуєте зображення занадто часто. Спробуйте пізніше.')
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as string // 'avatar' or 'banner'
    const teamSlug = formData.get('teamSlug') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!teamSlug) {
      return NextResponse.json({ error: 'Team slug required' }, { status: 400 })
    }

    if (!['avatar', 'banner'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    // Find team by slug
    const team = await prisma.team.findUnique({ where: { slug: teamSlug } })
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Check if user is owner
    const membership = await prisma.teamMembership.findUnique({
      where: {
        userId_teamId: { userId, teamId: team.id },
      },
    })

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only owner can upload' }, { status: 403 })
    }

    // Get old URLs for deletion
    const oldUrl = type === 'avatar' ? team.avatarUrl : team.bannerUrl

    const image = await prepareImageUpload(file, type === 'avatar' ? 'team-avatar' : 'team-banner')
    if ('error' in image) {
      return NextResponse.json({ error: image.error }, { status: 400 })
    }

    const filename = `teams/${team.id}/${type}_${randomUUID()}.${image.extension}`
    const url = await uploadToStorage(image.buffer, filename, image.contentType)

    // Update database
    const updateData = type === 'avatar' ? { avatarUrl: url } : { bannerUrl: url }
    await prisma.team.update({
      where: { id: team.id },
      data: updateData,
    })

    // Delete old file from R2
    if (oldUrl) {
      const oldPath = extractR2Path(oldUrl)
      if (oldPath) {
        await deleteFromStorage(oldPath)
      }
    }

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
