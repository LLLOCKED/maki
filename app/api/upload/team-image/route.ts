import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadToFTP, deleteFromFTP } from '@/lib/ftp'
import { isAuthResponse, requireUser } from '@/lib/permissions'
import { prepareImageUpload } from '@/lib/image-upload'
import { randomUUID } from 'crypto'

function extractFTPPath(url: string): { filename: string; folder: string } | null {
  if (!url) return null
  // URL format: https://edge-drive.cdn.express/teams/{teamId}/filename
  const match = url.match(/\/teams\/([^/]+)\/(.+)$/)
  if (!match) return null
  const teamId = match[1]
  const filename = match[2]
  return { filename, folder: `teams/${teamId}` }
}

export async function POST(request: Request) {
  try {
    const session = await requireUser()
    if (isAuthResponse(session)) return session

    const userId = session.user.id
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

    const ext = image.extension
    const filename = `${type}_${randomUUID()}.${ext}`

    const url = await uploadToFTP(image.buffer, filename, `teams/${team.id}`)

    // Update database
    const updateData = type === 'avatar' ? { avatarUrl: url } : { bannerUrl: url }
    await prisma.team.update({
      where: { id: team.id },
      data: updateData,
    })

    // Delete old file from FTP
    if (oldUrl) {
      const oldPath = extractFTPPath(oldUrl)
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
