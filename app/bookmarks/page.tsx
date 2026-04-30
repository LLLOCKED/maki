import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Card } from '@/components/ui/card'
import { BookOpen } from 'lucide-react'
import { Metadata } from 'next'
import BookmarksLibrary, { BookmarkItem } from '@/components/bookmarks-library'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Мої закладки',
  description: 'Ваші закладки для відстеження прогресу читання',
}

function formatChapterUrl(novelSlug: string, number: number, volume: number | null, teamSlug: string | null) {
  const volumePath = volume ? `${volume}.` : ''
  const teamPath = teamSlug ? `/${teamSlug}` : ''
  return `/read/${novelSlug}/${volumePath}${number}${teamPath}`
}

export default async function BookmarksPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/')
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id },
    include: {
      novel: {
        select: {
          id: true,
          title: true,
          slug: true,
          coverUrl: true,
          originalName: true,
          type: true,
          status: true,
          averageRating: true,
          chapters: {
            where: { moderationStatus: 'APPROVED' },
            orderBy: [{ volume: 'asc' }, { number: 'asc' }],
            select: {
              id: true,
              number: true,
              volume: true,
              team: { select: { slug: true } },
            },
          },
          _count: {
            select: { chapters: true },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const bookmarkItems: BookmarkItem[] = bookmarks.map((bookmark) => {
    const chapter =
      bookmark.novel.chapters.find((item) => item.number === bookmark.readingPosition) ||
      bookmark.novel.chapters[0]

    return {
      id: bookmark.id,
      novelId: bookmark.novelId,
      status: bookmark.status,
      readingPosition: bookmark.readingPosition,
      createdAt: bookmark.createdAt.toISOString(),
      updatedAt: bookmark.updatedAt.toISOString(),
      readHref: chapter
        ? formatChapterUrl(bookmark.novel.slug, chapter.number, chapter.volume, chapter.team?.slug || null)
        : null,
      novel: {
        id: bookmark.novel.id,
        title: bookmark.novel.title,
        slug: bookmark.novel.slug,
        coverUrl: bookmark.novel.coverUrl,
        originalName: bookmark.novel.originalName,
        averageRating: bookmark.novel.averageRating,
        chaptersCount: bookmark.novel._count.chapters,
      },
    }
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Мої закладки</h1>

      {bookmarks.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold">Немає закладок</h2>
          <p className="text-muted-foreground">
            Додавайте тайтли до закладок, щоб відстежувати свій прогрес
          </p>
        </Card>
      ) : (
        <BookmarksLibrary initialBookmarks={bookmarkItems} />
      )}
    </div>
  )
}
