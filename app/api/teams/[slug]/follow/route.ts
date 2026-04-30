import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'
import { isAuthResponse, requireUser } from '@/lib/permissions'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await requireUser()
  if (isAuthResponse(session)) return session

  const { slug } = await params

  try {
    const team = await prisma.team.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    await prisma.$executeRaw`
      INSERT INTO "TeamFollow" ("id", "userId", "teamId")
      VALUES (${randomUUID()}, ${session.user.id}, ${team.id})
      ON CONFLICT ("userId", "teamId") DO NOTHING
    `

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Follow team error:', error)
    return NextResponse.json({ error: 'Failed to follow team' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await requireUser()
  if (isAuthResponse(session)) return session

  const { slug } = await params

  try {
    const team = await prisma.team.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    await prisma.$executeRaw`
      DELETE FROM "TeamFollow"
      WHERE "userId" = ${session.user.id} AND "teamId" = ${team.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unfollow team error:', error)
    return NextResponse.json({ error: 'Failed to unfollow team' }, { status: 500 })
  }
}
