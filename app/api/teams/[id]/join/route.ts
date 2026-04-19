import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const teamId = params.id

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
      return NextResponse.json({ error: 'Already a member' }, { status: 400 })
    }

    // For now, just add as member (in future could require approval)
    const membership = await prisma.teamMembership.create({
      data: {
        userId: session.user.id,
        teamId,
        role: 'member',
      },
    })

    return NextResponse.json(membership, { status: 201 })
  } catch (error) {
    console.error('Join team error:', error)
    return NextResponse.json({ error: 'Failed to join team' }, { status: 500 })
  }
}
