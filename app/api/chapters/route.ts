import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

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
    const { title, number, content, novelId, teamId } = body

    if (!title || !number || !novelId) {
      return NextResponse.json(
        { error: 'Title, number and novelId are required' },
        { status: 400 }
      )
    }

    // Check if user is a member of the team (if teamId is provided)
    if (teamId) {
      const membership = await prisma.teamMembership.findUnique({
        where: {
          userId_teamId: {
            userId: session.user.id,
            teamId: teamId,
          },
        },
      })
      if (!membership) {
        return NextResponse.json(
          { error: 'You are not a member of this team' },
          { status: 403 }
        )
      }
    }

    const chapter = await prisma.chapter.create({
      data: {
        title,
        number: parseInt(number),
        content: content || '',
        novelId,
        teamId: teamId || null,
      },
      include: {
        novel: {
          select: {
            slug: true,
          },
        },
      },
    })

    return NextResponse.json(chapter, { status: 201 })
  } catch (error) {
    console.error('Error creating chapter:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
