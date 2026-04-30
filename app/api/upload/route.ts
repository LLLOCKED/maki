import { NextRequest, NextResponse } from 'next/server'
import { uploadToFTP } from '@/lib/ftp'
import { isAuthResponse, requireUser } from '@/lib/permissions'
import { prepareImageUpload } from '@/lib/image-upload'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  const session = await requireUser()
  if (isAuthResponse(session)) return session

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

    const ext = image.extension
    const filename = `${Date.now()}-${randomUUID()}.${ext}`

    const url = await uploadToFTP(image.buffer, filename, 'posters')

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
