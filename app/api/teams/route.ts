import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await auth()
  const { searchParams } = new URL(request.url)
  const mine = searchParams.get('mine')

  try {
    if (mine === 'true' && session?.user?.id) {
      const memberships = await prisma.teamMembership.findMany({
        where: { userId: session.user.id },
        include: {
          team: {
            include: {
              _count: {
                select: {
                  members: true,
                  chapters: true,
                },
              },
            },
          },
        },
      })
      return NextResponse.json(memberships.map((m) => m.team))
    }

    const teams = await prisma.team.findMany({
      include: {
        _count: {
          select: {
            members: true,
            chapters: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(teams)
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      )
    }

    // Create team and add user as owner
    const team = await prisma.team.create({
      data: {
        name,
        description: description || null,
        members: {
          create: {
            userId: session.user.id,
            role: 'owner',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
