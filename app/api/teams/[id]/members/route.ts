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
    const { userId, role } = await request.json()

    // Check if current user is owner or admin
    const membership = await prisma.teamMembership.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId,
        },
      },
    })

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json({ error: 'Not authorized to add members' }, { status: 403 })
    }

    // Find user by id
    const userToAdd = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!userToAdd) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if already a member
    const existingMembership = await prisma.teamMembership.findUnique({
      where: {
        userId_teamId: {
          userId: userToAdd.id,
          teamId,
        },
      },
    })

    if (existingMembership) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 })
    }

    // Add user to team
    const newMembership = await prisma.teamMembership.create({
      data: {
        userId: userToAdd.id,
        teamId,
        role: role || 'member',
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    })

    return NextResponse.json(newMembership, { status: 201 })
  } catch (error) {
    console.error('Add member error:', error)
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const teamId = params.id
    const { searchParams } = new URL(request.url)
    const userIdToRemove = searchParams.get('userId')

    if (!userIdToRemove) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Check if current user is owner or admin
    const membership = await prisma.teamMembership.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId,
        },
      },
    })

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json({ error: 'Not authorized to remove members' }, { status: 403 })
    }

    // Cannot remove owner
    const targetMembership = await prisma.teamMembership.findUnique({
      where: {
        userId_teamId: {
          userId: userIdToRemove,
          teamId,
        },
      },
    })

    if (targetMembership?.role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove owner' }, { status: 400 })
    }

    await prisma.teamMembership.delete({
      where: {
        userId_teamId: {
          userId: userIdToRemove,
          teamId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove member error:', error)
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  }
}
