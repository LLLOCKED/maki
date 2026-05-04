import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import ProfileClient from './profile-client'

interface UserPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: UserPageProps) {
  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    select: { name: true, image: true },
  })

  if (!user) return { title: 'Користувача не знайдено' }
  const title = `${user.name || 'Користувач'} — профіль honni`
  return {
    title,
    description: `Профіль користувача ${user.name || 'honni'}: команди, коментарі, оцінки та активність.`,
    alternates: { canonical: `/user/${id}` },
    openGraph: {
      type: 'profile',
      title,
      url: `/user/${id}`,
      images: user.image ? [{ url: user.image, alt: user.name || 'Користувач' }] : undefined,
    },
  }
}

export default async function UserPage({ params }: UserPageProps) {
  const { id } = await params
  const session = await auth()

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      lastSeen: true,
      teamMemberships: {
        include: {
          team: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
      comments: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          novel: {
            select: { id: true, slug: true, title: true },
          },
          chapter: {
            select: { id: true, number: true },
          },
        },
      },
      ratings: {
        include: {
          novel: {
            select: { id: true, slug: true, title: true, coverUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      favorites: {
        take: 20,
        include: {
          novel: {
            select: {
              id: true,
              slug: true,
              title: true,
              coverUrl: true,
              genres: { include: { genre: true } },
            },
          },
        },
      },
      novels: {
        where: { moderationStatus: { not: 'PENDING' } },
        select: {
          id: true,
          slug: true,
          title: true,
          coverUrl: true,
          type: true,
          moderationStatus: true,
          authorId: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: {
          comments: true,
          ratings: true,
        },
      },
    },
  })

  if (!user) {
    notFound()
  }

  const isOwn = session?.user?.id === user.id
  const isModerator = ['OWNER', 'ADMIN', 'MODERATOR'].includes(session?.user?.role || '')
  const recentBookmarks = isOwn || isModerator
    ? await prisma.$queryRaw<{
        id: string
        status: string
        readingPosition: number | null
        readingProgress: number
        updatedAt: Date
        novelId: string
        novelSlug: string
        novelTitle: string
        novelCoverUrl: string | null
        chaptersCount: bigint
      }[]>`
        SELECT
          b."id",
          b."status"::text as "status",
          b."readingPosition",
          b."readingProgress",
          b."updatedAt",
          n."id" as "novelId",
          n."slug" as "novelSlug",
          n."title" as "novelTitle",
          n."coverUrl" as "novelCoverUrl",
          COUNT(ch."id")::bigint as "chaptersCount"
        FROM "Bookmark" b
        JOIN "Novel" n ON n."id" = b."novelId"
        LEFT JOIN "Chapter" ch ON ch."novelId" = n."id" AND ch."moderationStatus" = 'APPROVED'
        WHERE b."userId" = ${user.id}
        GROUP BY b."id", n."id"
        ORDER BY b."updatedAt" DESC
        LIMIT 8
      `
    : []

  // For non-own profiles, filter out favorites (privacy) and show only public novels
  // But for own profile, we show all

  // Build favorites with novel data from favorites model
  const favoritesWithNovels = user.favorites.map(f => f.novel).filter(Boolean)
  const genreCounts = new Map<string, number>()
  for (const favorite of user.favorites) {
    for (const novelGenre of favorite.novel.genres) {
      genreCounts.set(novelGenre.genre.name, (genreCounts.get(novelGenre.genre.name) || 0) + 1)
    }
  }
  const favoriteGenres = Array.from(genreCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'uk'))
    .slice(0, 8)
  const activity = [
    ...user.comments.slice(0, 8).map((comment) => ({
      id: `comment-${comment.id}`,
      type: 'comment' as const,
      date: comment.createdAt,
      title: comment.novel?.title || 'Коментар',
      href: comment.novel?.slug ? `/novel/${comment.novel.slug}` : '#',
      label: comment.chapter ? `Коментар до глави ${comment.chapter.number}` : 'Коментар до тайтлу',
    })),
    ...user.ratings.slice(0, 8).map((rating) => ({
      id: `rating-${rating.id}`,
      type: 'rating' as const,
      date: rating.createdAt,
      title: rating.novel.title,
      href: `/novel/${rating.novel.slug}`,
      label: `Оцінка ${rating.value}/5`,
    })),
    ...recentBookmarks.slice(0, 8).map((bookmark) => ({
      id: `bookmark-${bookmark.id}`,
      type: 'bookmark' as const,
      date: bookmark.updatedAt,
      title: bookmark.novelTitle,
      href: `/novel/${bookmark.novelSlug}`,
      label: bookmark.readingPosition ? `Читає главу ${bookmark.readingPosition}` : 'Оновив закладку',
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)

  // Build user data for client
  const userData = {
    ...user,
    favorites: favoritesWithNovels.map(n => ({ id: n!.id, slug: n!.slug, title: n!.title, coverUrl: n!.coverUrl })),
    novels: user.novels,
    favoriteGenres,
    recentBookmarks: recentBookmarks.map((bookmark) => ({
      id: bookmark.id,
      status: bookmark.status,
      readingPosition: bookmark.readingPosition,
      readingProgress: bookmark.readingProgress,
      updatedAt: bookmark.updatedAt,
      novel: {
        id: bookmark.novelId,
        slug: bookmark.novelSlug,
        title: bookmark.novelTitle,
        coverUrl: bookmark.novelCoverUrl,
        chaptersCount: Number(bookmark.chaptersCount),
      },
    })),
    activity,
    _count: {
      ...user._count,
      favorites: user.favorites.length,
    },
  }

  return <ProfileClient user={userData as any} isOwn={isOwn} isModerator={isModerator} />
}
