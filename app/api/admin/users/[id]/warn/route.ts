import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthResponse, requireAdmin } from '@/lib/permissions'
import { isValidationResponse, parseJsonBody, warnUserSchema } from '@/lib/validation'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (isAuthResponse(session)) return session

  try {
    const { id } = await params
    const body = await parseJsonBody(req, warnUserSchema)
    if (isValidationResponse(body)) return body
    const { reason } = body

    const [warning] = await prisma.$transaction([
      prisma.userWarning.create({
        data: {
          userId: id,
          reason,
          issuedBy: session.user.id,
        },
      }),
      prisma.adminActivityLog.create({
        data: {
          userId: session.user.id,
          action: 'WARN_USER',
          targetId: id,
          targetType: 'user',
          details: JSON.stringify({ reason }),
        },
      }),
    ])

    return NextResponse.json(warning)
  } catch (error) {
    console.error('Error issuing warning:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (isAuthResponse(session)) return session

  try {
    const { id } = await params

    const warnings = await prisma.userWarning.findMany({
      where: { userId: id },
      include: {
        issuer: {
          select: { id: true, name: true, image: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(warnings)
  } catch (error) {
    console.error('Error fetching warnings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
