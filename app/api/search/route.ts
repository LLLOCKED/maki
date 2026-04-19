import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.toLowerCase()

  if (!query || query.length < 2) {
    return NextResponse.json([])
  }

  try {
    const [novels, teams, users] = await Promise.all([
      prisma.novel.findMany({
        take: 20,
        select: {
          id: true,
          slug: true,
          title: true,
          originalName: true,
          coverUrl: true,
        },
      }),
      prisma.team.findMany({
        take: 10,
        select: {
          id: true,
          name: true,
        },
      }),
      prisma.user.findMany({
        take: 10,
        where: {
          name: { contains: query },
        },
        select: {
          id: true,
          name: true,
        },
      }),
    ])

    // Filter client-side for case-insensitive search including Cyrillic
    const filteredNovels = novels.filter(
      (n) =>
        n.title.toLowerCase().includes(query) ||
        (n.originalName && n.originalName.toLowerCase().includes(query))
    )

    const filteredTeams = teams.filter((t) =>
      t.name.toLowerCase().includes(query)
    )

    const results = [
      ...filteredNovels.map((n) => ({
        type: 'novel' as const,
        id: n.slug,
        title: n.title,
        coverUrl: n.coverUrl,
      })),
      ...filteredTeams.map((t) => ({
        type: 'team' as const,
        id: t.id,
        title: t.name,
      })),
      ...users.map((u) => ({
        type: 'user' as const,
        id: u.id,
        title: u.name || 'Пользователь',
      })),
    ]

    return NextResponse.json(results)
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json([])
  }
}
