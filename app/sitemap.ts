import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://honni.fun'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/catalog`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/forum`, changeFrequency: 'hourly', priority: 0.7 },
    { url: `${BASE_URL}/rules`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/privacy`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/contact`, changeFrequency: 'monthly', priority: 0.3 },
  ]

  try {
    const [novels, topics] = await Promise.all([
      prisma.novel.findMany({
        where: { moderationStatus: 'APPROVED' },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 5000,
      }),
      prisma.forumTopic.findMany({
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 1000,
      }),
    ])

    return [
      ...staticRoutes,
      ...novels.map((novel) => ({
        url: `${BASE_URL}/novel/${novel.slug}`,
        lastModified: novel.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
      ...topics.map((topic) => ({
        url: `${BASE_URL}/forum/${topic.id}`,
        lastModified: topic.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      })),
    ]
  } catch (error) {
    console.error('Failed to build dynamic sitemap:', error)
    return staticRoutes
  }
}
