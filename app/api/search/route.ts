import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.toLowerCase()
  const type = searchParams.get('type') || 'all'

  if (!query || query.length < 2) {
    return NextResponse.json([])
  }

  try {
    const [novels, teams, users, topics] = await Promise.all([
      type === 'all' || type === 'novel' ? prisma.novel.findMany({
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
      }) : Promise.resolve([]),
      type === 'all' || type === 'team' ? prisma.team.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
        },
        take: 10,
        select: {
          id: true,
          slug: true,
          name: true,
        },
      }) : Promise.resolve([]),
      type === 'all' || type === 'user' ? prisma.user.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
        },
        take: 10,
        select: {
          id: true,
          name: true,
          image: true,
          lastSeen: true,
        },
      }) : Promise.resolve([]),
      type === 'all' || type === 'forum' ? prisma.forumTopic.findMany({
        where: {
          moderationStatus: 'APPROVED',
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 10,
        select: {
          id: true,
          title: true,
          content: true,
          category: { select: { name: true } },
          _count: { select: { comments: true } },
        },
      }) : Promise.resolve([]),
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
        title: u.name || 'Користувач',
        coverUrl: u.image,
        lastSeen: u.lastSeen,
      })),
      ...topics.map((topic) => ({
        type: 'forum' as const,
        id: topic.id,
        title: topic.title,
        subtitle: `${topic.category.name} • ${topic._count.comments} коментарів`,
        content: topic.content,
      })),
    ]

    return NextResponse.json(results)
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json([])
  }
}
