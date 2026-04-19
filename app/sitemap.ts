import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

const BASE_URL = 'https://ranobehub.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const novels = await prisma.novel.findMany({
    select: {
      slug: true,
      updatedAt: true,
    },
    where: {
      translationStatus: 'TRANSLATING',
    },
  })

  const novelUrls = novels.map((novel) => ({
    url: `${BASE_URL}/novel/${novel.slug}`,
    lastModified: novel.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/forum`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.6,
    },
    ...novelUrls,
  ]
}
