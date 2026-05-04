import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; requestId: string }> }
) {
  const { slug, requestId } = await params
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Потрібна авторизація' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const action = body.action

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'Невідома дія' }, { status: 400 })
    }

    const team = await prisma.team.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!team) {
      return NextResponse.json({ error: 'Команду не знайдено' }, { status: 404 })
    }

    const currentMembership = await prisma.teamMembership.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId: team.id,
        },
      },
    })

    if (!currentMembership || (currentMembership.role !== 'owner' && currentMembership.role !== 'admin')) {
      return NextResponse.json({ error: 'Недостатньо прав' }, { status: 403 })
    }

    const [joinRequest] = await prisma.$queryRaw<{ id: string; userId: string; teamId: string; status: string }[]>`
      SELECT "id", "userId", "teamId", "status"::text as "status"
      FROM "TeamJoinRequest"
      WHERE "id" = ${requestId}
      LIMIT 1
    `

    if (!joinRequest || joinRequest.teamId !== team.id) {
      return NextResponse.json({ error: 'Заявку не знайдено' }, { status: 404 })
    }

    if (joinRequest.status !== 'PENDING') {
      return NextResponse.json({ error: 'Заявку вже оброблено' }, { status: 400 })
    }

    if (action === 'reject') {
      const [rejected] = await prisma.$queryRaw<{ id: string; status: string }[]>`
        UPDATE "TeamJoinRequest"
        SET "status" = 'REJECTED'::"TeamJoinRequestStatus", "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${requestId}
        RETURNING "id", "status"::text as "status"
      `
      return NextResponse.json(rejected)
    }

    const result = await prisma.$transaction(async (tx) => {
      const membership = await tx.teamMembership.upsert({
        where: {
          userId_teamId: {
            userId: joinRequest.userId,
            teamId: team.id,
          },
        },
        update: {},
        create: {
          userId: joinRequest.userId,
          teamId: team.id,
          role: 'member',
        },
      })

      const [approved] = await tx.$queryRaw<{ id: string; status: string }[]>`
        UPDATE "TeamJoinRequest"
        SET "status" = 'APPROVED'::"TeamJoinRequestStatus", "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${requestId}
        RETURNING "id", "status"::text as "status"
      `

      return { membership, request: approved }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Handle team join request error:', error)
    return NextResponse.json({ error: 'Не вдалось обробити заявку' }, { status: 500 })
  }
}
