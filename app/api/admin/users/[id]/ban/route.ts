import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthResponse, requireAdmin } from '@/lib/permissions'
import { banUserSchema, isValidationResponse, parseJsonBody } from '@/lib/validation'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (isAuthResponse(session)) return session

  try {
    const { id } = await params
    const body = await parseJsonBody(req, banUserSchema)
    if (isValidationResponse(body)) return body
    const { ban, reason } = body

    const user = await prisma.user.update({
      where: { id },
      data: {
        isBanned: ban,
        banReason: ban ? (reason || null) : null,
        bannedAt: ban ? new Date() : null,
        bannedBy: ban ? session.user.id : null,
      },
    })

    await prisma.adminActivityLog.create({
      data: {
        userId: session.user.id,
        action: ban ? 'BAN_USER' : 'UNBAN_USER',
        targetId: id,
        targetType: 'user',
        details: ban ? JSON.stringify({ reason }) : null,
      },
    })

    return NextResponse.json({ success: true, isBanned: user.isBanned })
  } catch (error) {
    console.error('Error updating ban status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
