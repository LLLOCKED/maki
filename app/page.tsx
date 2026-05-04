import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import Image from 'next/image'
import SmallNovelCard from '@/components/small-novel-card'
import PosterNovelCard from '@/components/poster-novel-card'
import ForumTopicCard from '@/components/forum/forum-topic-card'
import NovelsList from '@/components/novels-list'
import AnnouncementCarousel from '@/components/announcement-carousel'
import AnnouncementBackground from '@/components/announcement-background'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Clock, Flame, MessageCircle, TrendingUp, Tag } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getNovels(page: number = 0, limit: number = 8) {
  const skip = page * limit

  const novels = await prisma.novel.findMany({
    where: { moderationStatus: 'APPROVED' },
    include: {
      genres: {
        include: {
          genre: true,
        },
      },
      chapters: {
        where: { moderationStatus: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          title: true,
          number: true,
          volume: true,
          createdAt: true,
          teamId: true,
          team: {
            select: { slug: true, name: true },
          },
        },
      },
      authors: {
        include: {
          author: true,
        },
      },
      _count: {
        select: {
          comments: true,
        },
      },
    },
    orderBy: [
      { createdAt: 'desc' },
      { id: 'asc' },
    ],
    skip,
    take: limit,
  })

  return novels
}

async function getPopularNovels() {
  return prisma.novel.findMany({
    where: { moderationStatus: 'APPROVED' },
    orderBy: { viewCount: 'desc' },
    take: 10,
    select: {
      id: true,
      title: true,
      slug: true,
      coverUrl: true,
      viewCount: true,
    },
  })
}

async function getDiscussedNovels() {
  return prisma.novel.findMany({
    where: { moderationStatus: 'APPROVED' },
    orderBy: { comments: { _count: 'desc' } },
    take: 10,
    select: {
      id: true,
      title: true,
      slug: true,
      coverUrl: true,
      _count: {
        select: { comments: true },
      },
    },
  })
}

async function getLatestNovels() {
  return prisma.novel.findMany({
    where: { moderationStatus: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      title: true,
      slug: true,
      coverUrl: true,
      type: true,
      isExplicit: true,
      contentWarnings: true,
      averageRating: true,
      createdAt: true,
      chapters: {
        where: { moderationStatus: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { createdAt: true },
      },
      authors: {
        include: { author: true },
      },
    },
  })
}

async function getForumTopics() {
  const topics = await prisma.forumTopic.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      user: {
        select: { id: true, name: true, image: true },
      },
      category: {
        select: { id: true, name: true, slug: true, color: true },
      },
      novel: {
        select: { id: true, title: true, slug: true },
      },
      votes: {
        select: { value: true, userId: true },
      },
      _count: {
        select: { comments: true },
      },
    },
  })
  return topics
}

async function getTotalNovelsCount() {
  return prisma.novel.count({ where: { moderationStatus: 'APPROVED' } })
}

async function getPopularTags() {
  return prisma.tag.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: { novels: true },
      },
    },
    orderBy: { novels: { _count: 'desc' } },
    take: 20,
  })
}

function formatChapterUrl(novelSlug: string, number: number, volume: number | null, teamSlug: string | null) {
  const volumePath = volume ? `${volume}.` : ''
  const teamPath = teamSlug ? `/${teamSlug}` : ''
  return `/read/${novelSlug}/${volumePath}${number}${teamPath}`
}

async function getContinueReading(userId?: string) {
  if (!userId) return []

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId,
      status: 'reading',
      readingPosition: { not: null },
      novel: { moderationStatus: 'APPROVED' },
    },
    orderBy: { updatedAt: 'desc' },
    take: 6,
    include: {
      novel: {
        select: {
          id: true,
          title: true,
          slug: true,
          coverUrl: true,
          chapters: {
            where: { moderationStatus: 'APPROVED' },
            orderBy: [{ volume: 'asc' }, { number: 'asc' }],
            select: {
              id: true,
              title: true,
              number: true,
              volume: true,
              team: { select: { slug: true } },
            },
          },
          _count: { select: { chapters: true } },
        },
      },
    },
  })

  return bookmarks
    .map((bookmark) => {
      const chapter =
        bookmark.novel.chapters.find((item) => item.number === bookmark.readingPosition) ||
        bookmark.novel.chapters[0]

      if (!chapter) return null

      return {
        id: bookmark.id,
        updatedAt: bookmark.updatedAt,
        readingPosition: bookmark.readingPosition,
        novel: bookmark.novel,
        chapter,
        href: formatChapterUrl(bookmark.novel.slug, chapter.number, chapter.volume, chapter.team?.slug || null),
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
}

export default async function HomePage() {
  const session = await auth()
  const [popularNovels, discussedNovels, latestForPosters, topics, totalNovels, initialNovels, popularTags, continueReading] = await Promise.all([
    getPopularNovels(),
    getDiscussedNovels(),
    getLatestNovels(),
    getForumTopics(),
    getTotalNovelsCount(),
    getNovels(0, 8),
    getPopularTags(),
    getContinueReading(session?.user?.id),
  ])

  // Top 5 by vote score
  const topTopics = [...topics]
    .map(t => ({
      ...t,
      voteScore: t.votes.reduce((sum, v) => sum + v.value, 0)
    }))
    .sort((a, b) => b.voteScore - a.voteScore)
    .slice(0, 5)

  // Top 5 most discussed topics
  const mostDiscussedTopics = [...topics]
    .sort((a, b) => b._count.comments - a._count.comments)
    .slice(0, 5)

  // Latest for posters - sort by chapter date or createdAt
  const latestSorted = [...latestForPosters].sort((a, b) => {
    const aDate = a.chapters[0]?.createdAt || a.createdAt
    const bDate = b.chapters[0]?.createdAt || b.createdAt
    return new Date(bDate).getTime() - new Date(aDate).getTime()
  })

  return (
    <>
      {/* <AnnouncementBackground /> */}
      <div className="overflow-hidden">
        <AnnouncementCarousel />
      </div>
      <div className="container mx-auto px-4 py-8">

        {totalNovels === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-semibold">Бібліотека пуста</h2>
            <p className="mt-2 text-muted-foreground">
              Новели скоро з&apos;вляться. Слідкуйте за оновленнями!
            </p>
          </div>
        ) : (
          <>
            {continueReading.length > 0 && (
              <section className="mb-8">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Продовжити читання</h2>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/history">Історія</Link>
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {continueReading.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="flex items-center gap-3 rounded-md border p-3 transition-colors hover:bg-muted"
                    >
                      <div className="relative flex h-16 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
                        {item.novel.coverUrl ? (
                          <Image src={item.novel.coverUrl} alt="" fill className="object-cover" sizes="48px" />
                        ) : (
                          <BookOpen className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-medium">{item.novel.title}</p>
                        <p className="line-clamp-1 text-xs text-muted-foreground">
                          Розділ {item.chapter.number}: {item.chapter.title}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Horizontal Poster Section */}
            {latestSorted.length > 0 && (
              <div className="mb-8">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Нові тайтли</h2>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/catalog?sortBy=created&sortOrder=desc">Більше</Link>
                  </Button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {latestSorted.map((novel) => (
                    <PosterNovelCard
                      key={novel.id}
                      novel={{
                        id: novel.id,
                        title: novel.title,
                        slug: novel.slug,
                        coverUrl: novel.coverUrl,
                        authors: novel.authors.map(a => a.author.name),
                        type: novel.type,
                        isExplicit: novel.isExplicit,
                        contentWarnings: novel.contentWarnings,
                        averageRating: novel.averageRating,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
              {/* Left Column: Novel Rankings */}
              <div className="lg:col-span-2">
                {/* Popular Novels */}
                <div className="mb-6">
                  <div className="mb-3 flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    <h2 className="text-lg font-semibold">Популярні тайтли</h2>
                  </div>
                  <div className="flex flex-col gap-2">
                    {popularNovels.map((novel) => (
                      <SmallNovelCard
                        key={novel.id}
                        novel={{
                          id: novel.id,
                          title: novel.title,
                          slug: novel.slug,
                          coverUrl: novel.coverUrl,
                          viewCount: novel.viewCount,
                        }}
                        variant="rating"
                      />
                    ))}
                  </div>
                </div>

                {/* Discussed Novels */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-blue-500" />
                    <h2 className="text-lg font-semibold">Обговорювані тайтли</h2>
                  </div>
                  <div className="flex flex-col gap-2">
                    {discussedNovels.map((novel) => (
                      <SmallNovelCard
                        key={novel.id}
                        novel={{
                          id: novel.id,
                          title: novel.title,
                          slug: novel.slug,
                          coverUrl: novel.coverUrl,
                          _count: novel._count,
                        }}
                        variant="discussed"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Middle Column: All Novels with infinite scroll */}
              <div className="lg:col-span-3">
                <NovelsList initialNovels={initialNovels as any} totalCount={totalNovels} />
              </div>

              {/* Right Column: Forum Topics */}
              <div className="lg:col-span-2">
                {/* Popular Topics */}
                <div className="mb-6">
                  <div className="mb-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-500" />
                    <h2 className="text-lg font-semibold">Популярні теми</h2>
                  </div>
                  <div className="flex flex-col gap-2">
                    {topTopics.map((topic) => (
                      <ForumTopicCard
                        key={topic.id}
                        topic={topic as any}
                        hideVotes
                        hideUserActivity
                      />
                    ))}
                  </div>
                </div>

                {/* Most Discussed Topics */}
                <div className="mb-6">
                  <div className="mb-3 flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-green-500" />
                    <h2 className="text-lg font-semibold">Обговорювані теми</h2>
                  </div>
                  <div className="flex flex-col gap-2">
                    {mostDiscussedTopics.map((topic) => (
                      <ForumTopicCard
                        key={topic.id}
                        topic={topic as any}
                        hideVotes
                        hideUserActivity
                      />
                    ))}
                  </div>
                </div>

                {/* Popular Tags */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Tag className="h-5 w-5 text-purple-500" />
                    <h2 className="text-lg font-semibold">Теги</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {popularTags.map((tag) => (
                      <Link key={tag.id} href={`/catalog?tags=${tag.slug}`}>
                        <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                          {tag.name}
                          <span className="ml-1 text-xs text-muted-foreground">
                            {tag._count.novels}
                          </span>
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
