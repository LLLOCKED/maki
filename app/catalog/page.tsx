import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@/lib/prisma-types'
import CatalogCard from '@/components/catalog-card'
import CatalogFilters from '@/components/catalog-filters'
import { getOrderBySql, buildNovelWhereClause } from '@/lib/novels'
import { BookOpen } from 'lucide-react'

interface SearchParams {
  search?: string
  genres?: string
  tags?: string
  authors?: string
  publishers?: string
  type?: string
  status?: string
  translationStatus?: string
  yearFrom?: string
  yearTo?: string
  sortBy?: string
  sortOrder?: string
  page?: string
}

async function getFiltersData() {
  const [genres, tags, authors] = await Promise.all([
    prisma.genre.findMany({ orderBy: { name: 'asc' } }),
    prisma.tag.findMany({ orderBy: { name: 'asc' } }),
    prisma.author.findMany({ orderBy: { name: 'asc' } }),
  ])
  return { genres, tags, authors }
}

async function getNovels(searchParams: SearchParams) {
  const page = parseInt(searchParams.page || '0')
  const limit = 12
  const skip = page * limit

  const sortBy = searchParams.sortBy || 'title'
  const sortOrder = searchParams.sortOrder || 'asc'
  const where = buildNovelWhereClause(searchParams)

  const orderBy: any[] = []
  if (sortBy === 'rating') {
    orderBy.push({ averageRating: sortOrder })
  } else if (sortBy === 'views') {
    orderBy.push({ viewCount: sortOrder })
  } else if (sortBy === 'year') {
    orderBy.push({ releaseYear: sortOrder })
  } else if (sortBy === 'created') {
    orderBy.push({ createdAt: sortOrder })
  } else {
    orderBy.push({ title: sortOrder })
  }
  orderBy.push({ id: 'asc' })

  let novels: any[] = []
  let total = 0

  if (searchParams.search) {
    const searchPattern = `%${searchParams.search}%`
    const orderBySql = getOrderBySql(sortBy, sortOrder)

    const novelResults = await prisma.$queryRaw<any[]>`
      SELECT id FROM "Novel"
      WHERE "moderationStatus" = 'APPROVED'
      AND ("title" ILIKE ${searchPattern}
        OR "originalName" ILIKE ${searchPattern})
      ORDER BY ${Prisma.raw(orderBySql)}
      LIMIT ${limit} OFFSET ${skip}
    `

    const novelIds = novelResults.map(n => n.id)

    if (novelIds.length > 0) {
      const novelsWithRelations = await prisma.novel.findMany({
        where: { id: { in: novelIds } },
        include: {
          genres: { include: { genre: true } },
          authors: { include: { author: true } },
          _count: { select: { comments: true } },
        },
      })

      novels = novelIds.map(id => novelsWithRelations.find(n => n.id === id)).filter(Boolean) as any[]
    }

    const countResult = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as cnt FROM "Novel"
      WHERE "moderationStatus" = 'APPROVED'
      AND ("title" ILIKE ${searchPattern}
        OR "originalName" ILIKE ${searchPattern})
    `
    total = Number(countResult[0]?.cnt || 0)
  } else {
    const [novelsResult, totalResult] = await Promise.all([
      prisma.novel.findMany({
        where,
        include: {
          genres: { include: { genre: true } },
          tags: { include: { tag: true } },
          authors: { include: { author: true } },
          publishers: { include: { publisher: true } },
          _count: { select: { comments: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.novel.count({ where }),
    ])
    novels = novelsResult
    total = totalResult
  }

  return { novels, total, hasMore: skip + novels.length < total }
}

export const metadata = {
  title: 'Каталог — honni',
  description: 'Каталог новел: фільтруйте за жанрами, тегами, авторами, статусом та роком випуску',
}

export default async function CatalogPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const resolvedParams = await searchParams
  const [{ genres, tags, authors }, { novels, total }] = await Promise.all([
    getFiltersData(),
    getNovels(resolvedParams),
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Каталог</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Знайдено {total} новел
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <Suspense fallback={<div>Завантаження...</div>}>
              <CatalogFilters genres={genres} tags={tags} authors={authors} variant="sidebar" />
            </Suspense>
          </div>
        </aside>

        <div>
          <div className="mb-6 lg:hidden">
            <Suspense fallback={<div>Завантаження...</div>}>
              <CatalogFilters genres={genres} tags={tags} authors={authors} />
            </Suspense>
          </div>

        {novels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-semibold">Нічого не знайдено</h2>
            <p className="mt-2 text-muted-foreground">
              Спробуйте змінити параметри фільтрації
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {novels.map((novel) => (
              <CatalogCard
                key={novel.id}
                novel={{
                  ...novel,
                  genres: novel.genres,
                }}
              />
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
