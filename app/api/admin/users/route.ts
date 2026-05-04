import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthResponse, requireAdmin } from '@/lib/permissions'

export async function GET(req: Request) {
  const session = await requireAdmin()
  if (isAuthResponse(session)) return session

  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const banned = searchParams.get('banned') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (banned) {
      where.isBanned = true
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          isBanned: true,
          createdAt: true,
          lastSeen: true,
          _count: {
            select: { warnings: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({ users, total })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
