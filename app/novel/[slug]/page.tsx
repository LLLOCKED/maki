import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertTriangle, Star, BookOpen, User, RefreshCw, Clock, Globe, Building2, Users, Plus, Tag, Eye, MessageCircle, Pencil, ShieldCheck, Languages, CalendarDays, Tags, HeartHandshake } from 'lucide-react'
import ChapterList from '@/components/chapter-list'
import ChapterTabs from '@/components/chapter-tabs'
import CommentSection from '@/components/comment-section'
import ViewTracker from '@/components/view-tracker'
import Rating from '@/components/rating'
import BookmarkButton from '@/components/bookmark-button'
import FavoriteButton from '@/components/favorite-button'
import SafeMarkdown from '@/components/safe-markdown'
import ResetModeration from '@/components/reset-moderation-button'
import { BreadcrumbJsonLd, NovelJsonLd } from '@/components/json-ld'
import ExplicitContentGate from '@/components/explicit-content-gate'
import ReportButton from '@/components/report-button'

interface NovelPageProps {
  params: Promise<{ slug: string }>
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

async function getNovel(slug: string, isAdmin: boolean = false, authorId?: string | null) {
  // Build where clause - admins see all, authors see their own pending
  const where: any = { slug }
  if (!isAdmin && !authorId) {
    where.moderationStatus = 'APPROVED'
  }

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
          volume: true,
          createdAt: true,
          teamId: true,
          moderationStatus: true,
          team: {
            select: {
              id: true,
              name: true,
              slug: true,
              avatarUrl: true,
            },
          },
        },
      },
      _count: {
        select: { comments: true },
      },
      forumTopics: {
        where: { novelId: { not: null } },
        include: {
          user: {
            select: { id: true, name: true, lastSeen: true },
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
  const { slug } = await params
  // Check if novel exists (authors can see their own pending novels)
  const checkNovel = await prisma.novel.findUnique({
    where: { slug },
    select: { id: true, authorId: true },
  })
  if (!checkNovel) return { title: 'Не знайдено' }

  const novel = await getNovel(slug, false, null)
  if (!novel) return { title: 'Не знайдено' }
  return {
    title: `${novel.title} — читати українською`,
    description: novel.description.slice(0, 160),
    alternates: { canonical: `/novel/${novel.slug}` },
    openGraph: {
      type: 'book',
      title: `${novel.title} — honni`,
      description: novel.description.slice(0, 160),
      url: `/novel/${novel.slug}`,
      images: novel.coverUrl ? [{ url: novel.coverUrl, alt: novel.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${novel.title} — honni`,
      description: novel.description.slice(0, 160),
      images: novel.coverUrl ? [novel.coverUrl] : undefined,
    },
  }
}

export default async function NovelPage({ params }: NovelPageProps) {
  const { slug } = await params
  const session = await auth()
  const sessionWithRole = session as { user?: { id?: string; role?: string } } | null
  const userRole = sessionWithRole?.user?.role
  const isAdmin = ['OWNER', 'ADMIN', 'MODERATOR'].includes(userRole || '')
  const userId = session?.user?.id

  // First check if novel exists and get its authorId
  const novelMeta = await prisma.novel.findUnique({
    where: { slug },
    select: { authorId: true, type: true },
  })

  if (!novelMeta) {
    notFound()
  }

  // Authors can see their own pending novels, admins see all
  const isAuthor = novelMeta.type === 'ORIGINAL' && userId === novelMeta.authorId
  const canViewPending = isAdmin || isAuthor

  const novel = await getNovel(slug, false, canViewPending ? userId : null)

  if (!novel) {
    notFound()
  }

  // Get user's bookmark and favorite for this novel
  let userBookmark = null
  let userRating = null
  let userFavorite = false
  if (session?.user?.id) {
    const [bookmark, rating, favorite] = await Promise.all([
      prisma.bookmark.findUnique({
        where: {
          userId_novelId: {
            userId: session.user.id,
            novelId: novel.id,
          },
        },
      }),
      prisma.rating.findUnique({
        where: {
          userId_novelId: {
            userId: session.user.id,
            novelId: novel.id,
          },
        },
      }),
      prisma.favorite.findUnique({
        where: {
          userId_novelId: {
            userId: session.user.id,
            novelId: novel.id,
          },
        },
      }),
    ])
    userBookmark = bookmark
    userRating = rating?.value || null
    userFavorite = !!favorite
  }

  // Check if user is a team member for any team with chapters on this novel
  let userTeamSlugs: string[] = []
  if (session?.user?.id) {
    const teamMemberships = await prisma.teamMembership.findMany({
      where: {
        userId: session.user.id,
        team: {
          chapters: {
            some: {
              novelId: novel.id,
            },
          },
        },
      },
      include: {
        team: {
          select: { slug: true },
        },
      },
    })
    userTeamSlugs = teamMemberships.map(m => m.team.slug)
  }

  // Get author info for ORIGINAL novels
  const author = novelMeta?.authorId ? await prisma.user.findUnique({
    where: { id: novelMeta.authorId },
    select: { id: true, name: true, image: true },
  }) : null

  const firstChapter = novel.chapters[0]
  const approvedChaptersCount = novel.chapters.filter(chapter => chapter.moderationStatus === 'APPROVED').length
  const translationTeams = Array.from(
    novel.chapters
      .filter(chapter => chapter.moderationStatus === 'APPROVED' && chapter.teamId && chapter.team)
      .reduce((teamsMap, chapter) => {
        const team = chapter.team!
        if (teamsMap.has(team.id)) return teamsMap

        teamsMap.set(team.id, {
          id: team.id,
          name: team.name,
          slug: team.slug,
          avatarUrl: team.avatarUrl,
        })
        return teamsMap
      }, new Map<string, {
        id: string
        name: string
        slug: string
        avatarUrl: string | null
      }>())
      .values()
  ).sort((a, b) => a.name.localeCompare(b.name, 'uk'))

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
      <BreadcrumbJsonLd
        items={[
          { name: 'honni', url: 'https://honni.fun' },
          { name: 'Каталог', url: 'https://honni.fun/catalog' },
          { name: novel.title, url: `https://honni.fun/novel/${novel.slug}` },
        ]}
      />
      <ExplicitContentGate
        novelId={novel.id}
        novelTitle={novel.title}
        isExplicit={novel.isExplicit}
      />
      <div className="container mx-auto px-4 py-8">
        <ViewTracker slug={novel.slug} />
      <div className="grid gap-8 grid-cols-1 md:grid-cols-[300px_1fr]">
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
                    loading="eager"
                  />
                ) : (
                  <Image
                    src={novel.coverUrl}
                    alt={novel.title}
                    fill
                    sizes="(min-width: 1024px) 400px, (min-width: 768px) 300px, 200px"
                    loading="eager"
                    className="object-cover"
                  />
                )
              ) : (
                <div className="flex h-full items-center justify-center">
                  <BookOpen className="h-16 w-16 text-muted-foreground" aria-hidden="true" />
                </div>
              )}
            </div>

            {firstChapter && (
              <Button asChild className="mt-4 w-full gap-2" size="lg">
                <Link href={`/read/${novel.slug}/${firstChapter.number}`}>
                  <BookOpen className="h-5 w-5" />
                  Почати читати
                </Link>
              </Button>
            )}

            <div className="mt-4 overflow-hidden rounded-md border bg-card text-sm">
              <div className="flex items-start justify-between gap-3 border-b px-3 py-2">
                <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  Додано
                </span>
                <span className="text-right">{formatDate(novel.createdAt)}</span>
              </div>
              <div className="flex items-start justify-between gap-3 border-b px-3 py-2">
                <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Оновлено
                </span>
                <span className="text-right">{formatDate(novel.updatedAt)}</span>
              </div>
              <div className="flex items-start justify-between gap-3 border-b px-3 py-2">
                <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
                  <Globe className="h-3.5 w-3.5" />
                  Тип
                </span>
                <span className="text-right">{typeLabels[novel.type] || novel.type}</span>
              </div>
              <div className="flex items-start justify-between gap-3 border-b px-3 py-2">
                <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Статус
                </span>
                <Badge variant="outline">{statusLabels[novel.status] || novel.status}</Badge>
              </div>
              <div className="flex items-start justify-between gap-3 border-b px-3 py-2">
                <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
                  <Languages className="h-3.5 w-3.5" />
                  Переклад
                </span>
                <Badge variant="secondary">
                  {translationStatusLabels[novel.translationStatus] || novel.translationStatus}
                </Badge>
              </div>
              {novel.releaseYear && (
                <div className="flex items-start justify-between gap-3 border-b px-3 py-2">
                  <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Рік
                  </span>
                  <span className="text-right">{novel.releaseYear}</span>
                </div>
              )}
              {novel.genres.length > 0 && (
                <div className="flex items-start justify-between gap-3 border-b px-3 py-2">
                  <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
                    <Tags className="h-3.5 w-3.5" />
                    Жанри
                  </span>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {novel.genres.map(({ genre }) => (
                      <Link key={genre.slug} href={`/catalog?genres=${genre.slug}`}>
                        <Badge variant="secondary" className="cursor-pointer hover:opacity-80">
                          {genre.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {novel.contentWarnings && novel.contentWarnings.length > 0 && (
                <div className="flex items-start justify-between gap-3 border-b px-3 py-2">
                  <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Попередження
                  </span>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {novel.contentWarnings.map((warning: string) => {
                      const warningLabels: Record<string, { label: string; color: string }> = {
                        violence: { label: 'Насилля', color: 'bg-red-500' },
                        gore: { label: 'Кров\'яні сцени', color: 'bg-red-700' },
                        sexual: { label: 'Сексуальний контент', color: 'bg-purple-500' },
                        psychological: { label: 'Психологічний тиск', color: 'bg-yellow-500' },
                        'self-harm': { label: 'Самогубство', color: 'bg-orange-500' },
                      }
                      const info = warningLabels[warning] || { label: warning, color: 'bg-gray-500' }
                      return (
                        <span
                          key={warning}
                          className={`inline-flex items-center rounded px-2 py-1 text-xs text-white ${info.color}`}
                          title={`Попередження: ${info.label}`}
                        >
                          <AlertTriangle className="mr-1 inline h-3 w-3" aria-hidden="true" />
                          {info.label}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
              {novel.authors.length > 0 && (
                <div className="flex items-start justify-between gap-3 border-b px-3 py-2">
                  <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    Автори
                  </span>
                  <div className="flex flex-wrap justify-end gap-x-1 gap-y-0.5 text-right">
                    {novel.authors.map(({ author }) => (
                      <Link key={author.id} href={`/catalog?authors=${author.slug}`} className="hover:text-primary">
                        {author.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {author && novel.type === 'ORIGINAL' && (
                <div className="flex items-start justify-between gap-3 border-b px-3 py-2">
                  <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    Автор
                  </span>
                  <Link href={`/user/${author.id}`} className="text-right hover:text-primary">
                    {author.name}
                  </Link>
                </div>
              )}
              {novel.publishers.length > 0 && (
                <div className="flex items-start justify-between gap-3 border-b px-3 py-2">
                  <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    Видавці
                  </span>
                  <div className="flex flex-wrap justify-end gap-x-1 gap-y-0.5 text-right">
                    {novel.publishers.map(({ publisher }) => (
                      <Link key={publisher.id} href={`/catalog?publishers=${publisher.slug}`} className="hover:text-primary">
                        {publisher.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {novel.type === 'ORIGINAL' && novel.donationUrl && (
                <div className="flex items-start justify-between gap-3 px-3 py-2">
                  <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
                    <HeartHandshake className="h-3.5 w-3.5" />
                    Підтримати
                  </span>
                  <a
                    href={novel.donationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-right text-primary hover:underline"
                  >
                    Донат
                  </a>
                </div>
              )}
              </div>
          </div>
        </div>

        {/* Info */}
        <div>
          <div className="mb-5">
            <h1 className="break-words text-3xl font-bold sm:text-4xl">{novel.title}</h1>
            {novel.originalName && (
              <p className="mt-1 text-lg text-muted-foreground italic">
                {novel.originalName}
              </p>
            )}
          </div>

          <Card className="mb-5 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <Star className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <Rating novelId={novel.id} initialRating={novel.averageRating} userRating={userRating ?? undefined} />
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                {session && (
                  <>
                    <BookmarkButton novelId={novel.id} initialStatus={userBookmark?.status} />
                    <FavoriteButton novelId={novel.id} initialIsFavorited={userFavorite} iconOnly />
                  </>
                )}
                <ReportButton targetType="NOVEL" novelId={novel.id} />
                {['OWNER', 'ADMIN'].includes(userRole || '') && (
                  <>
                    <Link href={`/admin/novels/${novel.slug}/edit`}>
                      <Button size="sm" variant="outline" className="h-9 w-9 p-0" aria-label="Редагувати тайтл" title="Редагувати тайтл">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <ResetModeration novelSlug={novel.slug} novelTitle={novel.title} />
                  </>
                )}
              </div>
            </div>
          </Card>

          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-md border bg-card p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                Розділи
              </div>
              <p className="mt-1 text-xl font-semibold">{approvedChaptersCount}</p>
            </div>
            <div className="rounded-md border bg-card p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="h-4 w-4" />
                Рейтинг
              </div>
              <p className="mt-1 text-xl font-semibold">{novel.averageRating.toFixed(1)}</p>
            </div>
            <div className="rounded-md border bg-card p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                Перегляди
              </div>
              <p className="mt-1 text-xl font-semibold">{novel.viewCount}</p>
            </div>
            <div className="rounded-md border bg-card p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                Коментарі
              </div>
              <p className="mt-1 text-xl font-semibold">{novel._count.comments}</p>
            </div>
          </div>

          <Card className="mb-6 p-4 sm:p-6 relative overflow-hidden mx-0">
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.04]"
              style={{ backgroundImage: "url('/static/images/back.svg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
            />
            <h2 className="mb-2 font-semibold relative z-10">Опис</h2>
            <div className="text-muted-foreground relative z-10 prose prose-base max-w-none">
              <SafeMarkdown breaks>{novel.description}</SafeMarkdown>
            </div>
          </Card>

          {/* Tags */}
          {novel.tags.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {novel.tags.map(({ tag }) => (
                <Link key={tag.slug} href={`/catalog?tags=${tag.slug}`}>
                  <Badge variant="outline" className="flex items-center gap-1 cursor-pointer hover:bg-muted">
                    <Tag className="h-3 w-3" />
                    {tag.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          {/* Translation Teams */}
          {translationTeams.length > 0 && (
            <section className="mb-8">
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Команди перекладу</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {translationTeams.map((team) => (
                  <Link key={team.id} href={`/team/${team.slug}`} className="group block">
                    <Card className="h-full overflow-hidden p-4 transition-colors hover:bg-muted/60">
                      <div className="flex items-center gap-3">
                        {team.avatarUrl ? (
                          <img
                            src={team.avatarUrl}
                            alt={team.name}
                            className="h-14 w-14 flex-shrink-0 rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-md bg-primary/10">
                            <Users className="h-7 w-7 text-primary" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="line-clamp-1 font-semibold group-hover:text-primary">
                            {team.name}
                          </h3>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Chapters by Team */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Розділи</h2>
            {session && (isAdmin || (novelMeta?.type === 'ORIGINAL' ? isAuthor : true)) && (
              <Link href={`/chapters/new?novel=${novel.slug}`}>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Додати розділ
                </Button>
              </Link>
            )}
          </div>
          <ChapterTabs novelSlug={novel.slug} chapters={novel.chapters as any} isAdmin={isAdmin} userTeamSlugs={userTeamSlugs} />

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
