import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { randomUUID } from 'crypto'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Потрібна авторизація' }, { status: 401 })
  }

  try {
    const team = await prisma.team.findUnique({ where: { slug } })
    if (!team) {
      return NextResponse.json({ error: 'Команду не знайдено' }, { status: 404 })
    }

    const teamId = team.id

    // Check if already a member
    const existing = await prisma.teamMembership.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'Ви вже в команді' }, { status: 400 })
    }

    const [request] = await prisma.$queryRaw<{ id: string; userId: string; teamId: string; status: string }[]>`
      INSERT INTO "TeamJoinRequest" ("id", "userId", "teamId", "status", "createdAt", "updatedAt")
      VALUES (${randomUUID()}, ${session.user.id}, ${teamId}, 'PENDING'::"TeamJoinRequestStatus", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("userId", "teamId")
      DO UPDATE SET "status" = 'PENDING'::"TeamJoinRequestStatus", "updatedAt" = CURRENT_TIMESTAMP
      RETURNING "id", "userId", "teamId", "status"
    `

    return NextResponse.json(request, { status: 201 })
  } catch (error) {
    console.error('Join team error:', error)
    return NextResponse.json({ error: 'Не вдалось надіслати заявку' }, { status: 500 })
  }
}
