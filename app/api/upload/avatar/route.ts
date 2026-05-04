import { NextResponse } from 'next/server'
import { uploadToStorage, deleteFromStorage } from '@/lib/storage'
import { prisma } from '@/lib/prisma'
import { isAuthResponse, requireUser } from '@/lib/permissions'
import { prepareImageUpload } from '@/lib/image-upload'
import { randomUUID } from 'crypto'
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit'

function extractR2AvatarPath(url: string): string | null {
  if (!url || !url.includes('cdn.honni.fun')) return null
  return url.split('/').slice(-2).join('/') // avatars/{filename}
}

export async function POST(request: Request) {
  const session = await requireUser()
  if (isAuthResponse(session)) return session
  const limit = rateLimit({
    key: `upload-avatar:${session.user.id}`,
    limit: 10,
    windowMs: 60 * 60 * 1000,
  })
  if (!limit.success) {
    return rateLimitResponse(limit, 'Ви завантажуєте аватарки занадто часто. Спробуйте пізніше.')
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Get old avatar URL for deletion
    const oldUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true },
    })
    const oldAvatarUrl = oldUser?.image || null

    const image = await prepareImageUpload(file, 'avatar')
    if ('error' in image) {
      return NextResponse.json({ error: image.error }, { status: 400 })
    }

    const filename = `avatars/${session.user.id}-${randomUUID()}.${image.extension}`
    const url = await uploadToStorage(image.buffer, filename, image.contentType)

    // Update user avatar
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: url },
    })

    // Delete old avatar if it existed on R2
    if (oldAvatarUrl) {
      const oldPath = extractR2AvatarPath(oldAvatarUrl)
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
