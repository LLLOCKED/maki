import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { uploadToStorage } from '@/lib/storage'
import { prepareImageUpload } from '@/lib/image-upload'
import { isAuthResponse, requireUser } from '@/lib/permissions'
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const session = await requireUser()
  if (isAuthResponse(session)) return session

  const limit = rateLimit({
    key: `upload-chapter-image:${session.user.id}`,
    limit: 30,
    windowMs: 60 * 60 * 1000,
  })
  if (!limit.success) {
    return rateLimitResponse(limit, 'Ви завантажуєте зображення занадто часто. Спробуйте пізніше.')
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Файл не передано' }, { status: 400 })
    }

    const image = await prepareImageUpload(file, 'chapter-image')
    if ('error' in image) {
      return NextResponse.json({ error: image.error }, { status: 400 })
    }

    const filename = `chapters/${Date.now()}-${randomUUID()}.${image.extension}`

    // Upload directly to R2
    const url = await uploadToStorage(image.buffer, filename, image.contentType)

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Chapter image upload error:', error)
    return NextResponse.json({ error: 'Не вдалось завантажити зображення' }, { status: 500 })
  }
}
