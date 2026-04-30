import { NextResponse } from 'next/server'
import { uploadToFTP, deleteFromFTP } from '@/lib/ftp'
import { prisma } from '@/lib/prisma'
import { isAuthResponse, requireUser } from '@/lib/permissions'
import { prepareImageUpload } from '@/lib/image-upload'
import { randomUUID } from 'crypto'

function extractFTPAvatarPath(url: string): { filename: string; folder: string } | null {
  if (!url || !url.includes('edge-drive.cdn.express')) return null
  const match = url.match(/\/avatars\/(.+)$/)
  if (!match) return null
  return { filename: match[1], folder: 'avatars' }
}

export async function POST(request: Request) {
  const session = await requireUser()
  if (isAuthResponse(session)) return session

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

    const ext = image.extension
    const filename = `${session.user.id}-${randomUUID()}.${ext}`

    const url = await uploadToFTP(image.buffer, filename, 'avatars')

    // Update user avatar
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: url },
    })

    // Delete old avatar if it existed and is hosted on FTP
    if (oldAvatarUrl) {
      const oldPath = extractFTPAvatarPath(oldAvatarUrl)
      if (oldPath) {
        await deleteFromFTP(oldPath.filename, oldPath.folder)
      }
    }

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
