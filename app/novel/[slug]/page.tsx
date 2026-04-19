import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Star, BookOpen, User, RefreshCw, Clock, Globe, Building2, Users, Plus, Tag } from 'lucide-react'
import ChapterList from '@/components/chapter-list'
import ChapterTabs from '@/components/chapter-tabs'
import CommentSection from '@/components/comment-section'
import ViewTracker from '@/components/view-tracker'
import Rating from '@/components/rating'
import BookmarkButton from '@/components/bookmark-button'
import { NovelJsonLd } from '@/components/json-ld'

interface NovelPageProps {
  params: { slug: string }
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const typeLabels: Record<string, string> = {
  JAPAN: 'Японія',
  KOREA: 'Корея',
  CHINA: 'Китай',
  ENGLISH: 'Англійська',
  ORIGINAL: 'Авторський',
}

const statusLabels: Record<string, string> = {
  ONGOING: 'Онгоінг',
  COMPLETED: 'Завершено',
  SUSPENDED: 'Призупинено',
}

const translationStatusLabels: Record<string, string> = {
  TRANSLATING: 'Перекладається',
  DROPPED: 'Залишено',
  COMPLETED: 'Завершено',
  HIATUS: 'На паузі',
}

async function getNovel(slug: string, isAdmin: boolean = false) {
  const where = isAdmin
    ? { slug }
    : { slug, moderationStatus: 'APPROVED' }

  const novel = await prisma.novel.findUnique({
    where,
    include: {
      genres: {
        include: {
          genre: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      publishers: {
        include: {
          publisher: true,
        },
      },
      authors: {
        include: {
          author: true,
        },
      },
      chapters: {
        orderBy: {
          number: 'asc',
        },
        select: {
          id: true,
          title: true,
          number: true,
          createdAt: true,
          teamId: true,
          moderationStatus: true,
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      ratings: true,
      forumTopics: {
        where: { novelId: { not: null } },
        include: {
          user: {
            select: { id: true, name: true },
          },
          category: {
            select: { id: true, name: true, slug: true, color: true },
          },
          _count: {
            select: { comments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  return novel
}

export async function generateMetadata({ params }: NovelPageProps) {
  const novel = await getNovel(params.slug)
  if (!novel) return { title: 'Не знайдено' }
  return {
    title: `${novel.title} — RanobeHub`,
    description: novel.description,
  }
}

export default async function NovelPage({ params }: NovelPageProps) {
  const session = await auth()
  const sessionWithRole = session as { user?: { id?: string; role?: string } } | null
  const userRole = sessionWithRole?.user?.role
  const isAdmin = ['OWNER', 'ADMIN', 'MODERATOR'].includes(userRole || '')
  const novel = await getNovel(params.slug, isAdmin)

  if (!novel) {
    notFound()
  }

  // Get user's bookmark for this novel
  let userBookmark = null
  if (session?.user?.id) {
    userBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_novelId: {
          userId: session.user.id,
          novelId: novel.id,
        },
      },
    })
  }

  const firstChapter = novel.chapters[0]

  return (
    <>
      <NovelJsonLd
        title={novel.title}
        description={novel.description}
        slug={novel.slug}
        coverUrl={novel.coverUrl}
        authors={novel.authors.map(({ author }) => author.name)}
        averageRating={novel.averageRating}
        genres={novel.genres.map(({ genre }) => genre.name)}
      />
      <div className="container mx-auto px-4 py-8">
        <ViewTracker slug={novel.slug} />
      <div className="grid gap-8 md:grid-cols-[300px_1fr]">
        {/* Cover */}
        <div>
          <div className="sticky top-4">
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted shadow-lg">
              {novel.coverUrl ? (
                novel.coverUrl.startsWith('/') ? (
                  <img
                    src={novel.coverUrl}
                    alt={novel.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Image
                    src={novel.coverUrl}
                    alt={novel.title}
                    fill
                    className="object-cover"
                  />
                )
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="text-6xl">📚</span>
                </div>
              )}
            </div>

            {firstChapter && (
              <Link href={`/read/${novel.slug}/${firstChapter.number}`}>
                <Button className="mt-4 w-full gap-2" size="lg">
                  <BookOpen className="h-5 w-5" />
                  Почати читати
                </Button>
              </Link>
            )}

            <div className="mt-4 space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>Додано: {formatDate(novel.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="h-3 w-3" />
                <span>Оновлено: {formatDate(novel.updatedAt)}</span>
              </div>
            </div>

            {/* Meta info under dates */}
            <div className="mt-6 space-y-2 border-t pt-4">
              {/* Authors */}
              {novel.authors.length > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <User className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div className="flex flex-wrap gap-1">
                  {novel.authors.map(({ author }) => (
                      <span key={author.id}>{author.name}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Publishers */}
              {novel.publishers.length > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <Building2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div className="flex flex-wrap gap-1">
                    {novel.publishers.map(({ publisher }) => (
                      <span key={publisher.id}>{publisher.name}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Type */}
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <span>{typeLabels[novel.type] || novel.type}</span>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Статус:</span>
                <Badge variant="outline">{statusLabels[novel.status] || novel.status}</Badge>
              </div>

              {/* Translation Status */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Переклад:</span>
                <Badge variant="secondary">
                  {translationStatusLabels[novel.translationStatus] || novel.translationStatus}
                </Badge>
              </div>

              {/* Release Year */}
              {novel.releaseYear && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Рік:</span>
                  <span>{novel.releaseYear}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div>
          <div className="mb-6">
            <h1 className="text-4xl font-bold">{novel.title}</h1>
            {novel.originalName && (
              <p className="mt-1 text-lg text-muted-foreground italic">
                {novel.originalName}
              </p>
            )}
          </div>

          {/* Rating and Bookmark */}
          <div className="mb-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
              <Rating novelId={novel.id} initialRating={novel.averageRating} />
            </div>
            {session && (
              <BookmarkButton novelId={novel.id} initialStatus={userBookmark?.status} />
            )}
          </div>

          {/* Genres */}
          {novel.genres.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {novel.genres.map(({ genre }) => (
                <Badge key={genre.slug} variant="secondary">
                  {genre.name}
                </Badge>
              ))}
            </div>
          )}

          <Card className="mb-8 p-6">
            <h2 className="mb-2 font-semibold">Опис</h2>
            <p className="text-muted-foreground">{novel.description}</p>
          </Card>

          {/* Tags */}
          {novel.tags.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {novel.tags.map(({ tag }) => (
                <Badge key={tag.slug} variant="outline" className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Teams */}
          {(() => {
            const teamsMap = new Map<string, { id: string; name: string }>()
            for (const chapter of novel.chapters) {
              if (chapter.teamId && chapter.team && !teamsMap.has(chapter.teamId)) {
                teamsMap.set(chapter.teamId, chapter.team)
              }
            }
            const teams = Array.from(teamsMap.values())

            return teams.length > 0 ? (
              <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">Переклад:</span>
                {teams.map((team) => (
                  <Link key={team.id} href={`/team/${team.id}`}>
                    <Badge variant="outline" className="hover:bg-muted cursor-pointer">
                      <Users className="mr-1 h-3 w-3" />
                      {team.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : null
          })()}

          {/* Chapters by Team */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Розділи</h2>
            {session && (
              <Link href={`/admin/chapters/new?novel=${novel.slug}`}>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Додати розділ
                </Button>
              </Link>
            )}
          </div>
          <ChapterTabs novelSlug={novel.slug} chapters={novel.chapters as any} isAdmin={isAdmin} />

          {/* Comments */}
          <CommentSection novelId={novel.id} />

          {/* Forum Topics */}
          {novel.forumTopics.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-4 text-xl font-semibold">Обговорення</h2>
              <div className="space-y-2">
                {novel.forumTopics.map((topic) => (
                  <Link key={topic.id} href={`/forum/${topic.id}`}>
                    <Card className="p-4 transition-colors hover:bg-muted">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          style={{
                            backgroundColor: topic.category.color + '20',
                            color: topic.category.color,
                          }}
                        >
                          {topic.category.name}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(topic.createdAt).toLocaleDateString('uk-UA')}
                        </span>
                      </div>
                      <h3 className="font-medium hover:text-primary">{topic.title}</h3>
                      <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{topic.user.name}</span>
                        <span>{topic._count.comments} коментарів</span>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  )
}
