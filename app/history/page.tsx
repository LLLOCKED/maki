import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Історія читання',
  description: 'Останні тайтли та розділи, які ви читали',
}

function formatChapterUrl(novelSlug: string, number: number, volume: number | null, teamSlug: string | null) {
  const volumePath = volume ? `${volume}.` : ''
  const teamPath = teamSlug ? `/${teamSlug}` : ''
  return `/read/${novelSlug}/${volumePath}${number}${teamPath}`
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default async function HistoryPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId: session.user.id,
      readingPosition: { not: null },
      novel: { moderationStatus: 'APPROVED' },
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
    include: {
      novel: {
        select: {
          id: true,
          title: true,
          slug: true,
          coverUrl: true,
          originalName: true,
          chapters: {
            where: { moderationStatus: 'APPROVED' },
            orderBy: [{ volume: 'asc' }, { number: 'asc' }],
            select: {
              id: true,
              title: true,
              number: true,
              volume: true,
              team: { select: { slug: true, name: true } },
            },
          },
          _count: { select: { chapters: true } },
        },
      },
    },
  })

  const historyItems = bookmarks
    .map((bookmark) => {
      const chapter =
        bookmark.novel.chapters.find((item) => item.number === bookmark.readingPosition) ||
        bookmark.novel.chapters[0]

      if (!chapter) return null

      return {
        bookmark,
        chapter,
        href: formatChapterUrl(bookmark.novel.slug, chapter.number, chapter.volume, chapter.team?.slug || null),
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <Clock className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Історія читання</h1>
          <p className="text-sm text-muted-foreground">
            Останні розділи, на яких ви зупинилися
          </p>
        </div>
      </div>

      {historyItems.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold">Історія поки порожня</h2>
          <p className="mb-4 text-muted-foreground">
            Відкрийте будь-який розділ, і він з&apos;явиться тут.
          </p>
          <Button asChild>
            <Link href="/catalog">Перейти в каталог</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {historyItems.map(({ bookmark, chapter, href }) => (
            <Card key={bookmark.id} className="overflow-hidden">
              <CardContent className="flex gap-4 p-4">
                <Link href={`/novel/${bookmark.novel.slug}`} className="relative flex h-24 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
                  {bookmark.novel.coverUrl ? (
                    <Image
                      src={bookmark.novel.coverUrl}
                      alt={bookmark.novel.title}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <BookOpen className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <Link href={`/novel/${bookmark.novel.slug}`} className="hover:underline">
                    <h2 className="line-clamp-1 font-semibold">{bookmark.novel.title}</h2>
                  </Link>
                  {bookmark.novel.originalName && (
                    <p className="line-clamp-1 text-xs italic text-muted-foreground">
                      {bookmark.novel.originalName}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-muted-foreground">
                    Розділ {chapter.number}: {chapter.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Оновлено {formatDate(bookmark.updatedAt)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button asChild size="sm">
                      <Link href={href}>Продовжити</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/novel/${bookmark.novel.slug}`}>До тайтлу</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
