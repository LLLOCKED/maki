import { NextResponse } from 'next/server'
import { deleteFromFTP } from '@/lib/ftp'
import { prisma } from '@/lib/prisma'
import { ADMIN_ROLES, hasRole, isAuthResponse, requireUser } from '@/lib/permissions'
import { deleteUploadSchema, isValidationResponse, parseJsonBody } from '@/lib/validation'

export async function POST(request: Request) {
  const session = await requireUser()
  if (isAuthResponse(session)) return session

  try {
    const body = await parseJsonBody(request, deleteUploadSchema)
    if (isValidationResponse(body)) return body
    const { filename, folder } = body

    if (folder === 'avatars' && !filename.startsWith(`${session.user.id}-`)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (folder === 'posters' && !hasRole(session, ADMIN_ROLES)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (folder.startsWith('teams/')) {
      const teamId = folder.split('/')[1]
      const membership = await prisma.teamMembership.findUnique({
        where: {
          userId_teamId: {
            userId: session.user.id,
            teamId,
          },
        },
      })

      if (!membership || membership.role !== 'owner') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    await deleteFromFTP(filename, folder)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
