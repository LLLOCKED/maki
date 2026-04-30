import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { isAuthResponse, requireUser } from '@/lib/permissions'
import { createTeamSchema, isValidationResponse, parseJsonBody } from '@/lib/validation'

// Transliteration map for Ukrainian/Cyrillic to Latin
const transliterationMap: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'д': 'd', 'е': 'e', 'є': 'ye', 'ж': 'zh', 'з': 'z', 'и': 'y', 'і': 'i', 'ї': 'yi', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '', 'ю': 'yu', 'я': 'ya',
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'H', 'Д': 'D', 'Е': 'E', 'Є': 'Ye', 'Ж': 'Zh', 'З': 'Z', 'И': 'Y', 'І': 'I', 'Ї': 'Yi', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch', 'Ь': '', 'Ю': 'Yu', 'Я': 'Ya',
}

function transliterateToLatin(text: string): string {
  return text
    .split('')
    .map(char => transliterationMap[char] || char)
    .join('')
}

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
  const session = await requireUser()
  if (isAuthResponse(session)) return session

  try {
    const body = await parseJsonBody(request, createTeamSchema)
    if (isValidationResponse(body)) return body
    const { name, description } = body

    // Generate slug from name (transliterated to Latin)
    const transliterated = transliterateToLatin(name)
    const slug = transliterated
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 50)

    // Create team and add user as owner
    const team = await prisma.team.create({
      data: {
        name,
        slug,
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
