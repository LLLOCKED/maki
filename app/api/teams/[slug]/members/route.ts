import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addTeamMemberSchema, isValidationResponse, parseJsonBody } from '@/lib/validation'
import { isAuthResponse, requireUser } from '@/lib/permissions'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const session = await requireUser()
  if (isAuthResponse(session)) return session

  try {
    const team = await prisma.team.findUnique({ where: { slug } })
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const teamId = team.id
    const body = await parseJsonBody(request, addTeamMemberSchema)
    if (isValidationResponse(body)) return body
    const { userId, role: requestedRole } = body

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

    if (membership.role !== 'owner' && requestedRole !== 'member') {
      return NextResponse.json({ error: 'Only team owners can assign elevated roles' }, { status: 403 })
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
        role: requestedRole,
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
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const session = await requireUser()
  if (isAuthResponse(session)) return session

  try {
    const team = await prisma.team.findUnique({ where: { slug } })
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const teamId = team.id
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
