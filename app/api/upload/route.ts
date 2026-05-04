import { NextRequest, NextResponse } from 'next/server'
import { uploadToStorage } from '@/lib/storage'
import { isAuthResponse, requireUser } from '@/lib/permissions'
import { prepareImageUpload } from '@/lib/image-upload'
import { randomUUID } from 'crypto'
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const session = await requireUser()
  if (isAuthResponse(session)) return session
  const limit = rateLimit({
    key: `upload-poster:${session.user.id}`,
    limit: 20,
    windowMs: 60 * 60 * 1000,
  })
  if (!limit.success) {
    return rateLimitResponse(limit, 'Ви завантажуєте файли занадто часто. Спробуйте пізніше.')
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const image = await prepareImageUpload(file, 'poster')
    if ('error' in image) {
      return NextResponse.json({ error: image.error }, { status: 400 })
    }

    const filename = `posters/${Date.now()}-${randomUUID()}.${image.extension}`
    const url = await uploadToStorage(image.buffer, filename, image.contentType)

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
