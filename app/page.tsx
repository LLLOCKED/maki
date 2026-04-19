import { prisma } from '@/lib/prisma'
import SmallNovelCard from '@/components/small-novel-card'
import PosterNovelCard from '@/components/poster-novel-card'
import ForumTopicCard from '@/components/forum/forum-topic-card'
import NovelsList from '@/components/novels-list'
import { BookOpen, Flame, MessageCircle, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getNovels(page: number = 0, limit: number = 8) {
  const skip = page * limit

  const novels = await prisma.novel.findMany({
    include: {
      genres: {
        include: {
          genre: true,
        },
      },
      chapters: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          title: true,
          number: true,
          createdAt: true,
          teamId: true,
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
    skip,
    take: limit,
  })

  return novels
}

async function getAllNovelsForCounts() {
  return prisma.novel.findMany({
    include: {
      genres: {
        include: {
          genre: true,
        },
      },
      chapters: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          title: true,
          number: true,
          createdAt: true,
          teamId: true,
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
  })
}

async function getForumTopics() {
  const topics = await prisma.forumTopic.findMany({
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
      votes: true,
      _count: {
        select: { comments: true },
      },
    },
  })
  return topics
}

export default async function HomePage() {
  const [allNovels, topics] = await Promise.all([
    getAllNovelsForCounts(),
    getForumTopics(),
  ])

  // For initial load, get first 8 novels
  const initialNovels = await getNovels(0, 8)
  const totalNovels = allNovels.length

  // Sort for rankings
  const popularNovels = [...allNovels].sort(
    (a, b) => b.viewCount - a.viewCount
  ).slice(0, 10)

  const discussedNovels = [...allNovels].sort(
    (a, b) => b._count.comments - a._count.comments
  ).slice(0, 10)

  // Latest 10 for horizontal poster scroll
  const latestForPosters = [...allNovels]
    .sort((a, b) => {
      const aDate = a.chapters[0]?.createdAt || a.createdAt
      const bDate = b.chapters[0]?.createdAt || b.createdAt
      return new Date(bDate).getTime() - new Date(aDate).getTime()
    })
    .slice(0, 10)

  // Top 10 by vote score
  const topTopics = [...topics]
    .map(t => ({
      ...t,
      voteScore: t.votes.reduce((sum, v) => sum + v.value, 0)
    }))
    .sort((a, b) => b.voteScore - a.voteScore)
    .slice(0, 10)

  // Top 10 most discussed topics
  const mostDiscussedTopics = [...topics]
    .sort((a, b) => b._count.comments - a._count.comments)
    .slice(0, 10)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <BookOpen className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">honni</h1>
          <p className="text-muted-foreground">
            {totalNovels} творів у бібліотеці
          </p>
        </div>
      </div>

      {totalNovels === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-6xl">📚</span>
          <h2 className="mt-4 text-xl font-semibold">Бібліотека пуста</h2>
          <p className="mt-2 text-muted-foreground">
            Новели скоро з&apos;являться. Слідкуйте за оновленнями!
          </p>
        </div>
      ) : (
        <>
          {/* Horizontal Poster Section */}
          {latestForPosters.length > 0 && (
            <div className="mb-8">
              <div className="mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Нові тайтли</h2>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {latestForPosters.map((novel) => (
                  <PosterNovelCard
                    key={novel.id}
                    novel={{
                      id: novel.id,
                      title: novel.title,
                      slug: novel.slug,
                      coverUrl: novel.coverUrl,
                      authors: novel.authors.map(a => a.author.name),
                      type: novel.type,
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
                    />
                  ))}
                </div>
              </div>

              {/* Most Discussed Topics */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-green-500" />
                  <h2 className="text-lg font-semibold">Обговорювані теми</h2>
                </div>
                <div className="flex flex-col gap-2">
                  {mostDiscussedTopics.map((topic) => (
                    <ForumTopicCard
                      key={topic.id}
                      topic={topic as any}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
