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
        where: {
          moderationStatus: 'APPROVED',
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { originalName: { contains: query, mode: 'insensitive' } },
          ],
        },
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
        where: {
          name: { contains: query, mode: 'insensitive' },
        },
        take: 10,
        select: {
          id: true,
          slug: true,
          name: true,
        },
      }),
      prisma.user.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
        },
        take: 10,
        select: {
          id: true,
          name: true,
        },
      }),
    ])

    const results = [
      ...novels.map((n) => ({
        type: 'novel' as const,
        id: n.slug,
        title: n.title,
        coverUrl: n.coverUrl,
      })),
      ...teams.map((t) => ({
        type: 'team' as const,
        id: t.slug,
        title: t.name,
      })),
      ...users.map((u) => ({
        type: 'user' as const,
        id: u.id,
        title: u.name || 'Пользовазовач',
      })),
    ]

    return NextResponse.json(results)
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json([])
  }
}