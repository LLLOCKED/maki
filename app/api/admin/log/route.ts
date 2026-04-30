import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthResponse, requireAdmin } from '@/lib/permissions'
import { adminLogSchema, isValidationResponse, parseJsonBody } from '@/lib/validation'

export async function POST(req: Request) {
  const session = await requireAdmin()
  if (isAuthResponse(session)) return session

  try {
    const body = await parseJsonBody(req, adminLogSchema)
    if (isValidationResponse(body)) return body
    const { action, targetId, targetType, details } = body

    const log = await prisma.adminActivityLog.create({
      data: {
        userId: session.user.id,
        action,
        targetId,
        targetType,
        details: details ? JSON.stringify(details) : null,
      },
    })

    return NextResponse.json(log)
  } catch (error) {
    console.error('Error creating activity log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const session = await requireAdmin()
  if (isAuthResponse(session)) return session

  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')

    const where: { action?: string; userId?: string } = {}
    if (action) where.action = action
    if (userId) where.userId = userId

    const [logs, total] = await Promise.all([
      prisma.adminActivityLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.adminActivityLog.count({ where }),
    ])

    return NextResponse.json({ logs, total, limit, offset })
  } catch (error) {
    console.error('Error fetching activity logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
