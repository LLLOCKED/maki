import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const team = await prisma.team.findUnique({ where: { slug } })
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const userId = session.user.id
    const teamId = team.id

    const membership = await prisma.teamMembership.findUnique({
      where: {
        userId_teamId: { userId, teamId },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not a member' }, { status: 400 })
    }

    // If leaving a team, check ownership transfer
    if (membership.role === 'owner') {
      // Find next owner - admin or moderator (by order: admin, then member)
      const nextOwner = await prisma.teamMembership.findFirst({
        where: {
          teamId,
          userId: { not: userId },
          role: { in: ['admin', 'member'] },
        },
        orderBy: [
          { role: 'asc' }, // admin comes before member
          { joinedAt: 'asc' }, // earliest first
        ],
      })

      if (nextOwner) {
        // Transfer ownership
        await prisma.teamMembership.update({
          where: { id: nextOwner.id },
          data: { role: 'owner' },
        })
      }
      // If no other members, team stays with no owner
    }

    // Remove membership
    await prisma.teamMembership.delete({
      where: { userId_teamId: { userId, teamId } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error leaving team:', error)
    return NextResponse.json(
      { error: 'Failed to leave team' },
      { status: 500 }
    )
  }
}
