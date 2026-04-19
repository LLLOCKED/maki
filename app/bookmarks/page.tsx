import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen } from 'lucide-react'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Мої закладки',
  description: 'Ваші закладки для відстеження прогресу читання',
}

const statusLabels: Record<string, string> = {
  reading: 'Читаю',
  planned: 'В планах',
  completed: 'Прочитано',
  dropped: 'Залишено',
}

const statusColors: Record<string, string> = {
  reading: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  planned: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  completed: 'bg-green-500/10 text-green-500 border-green-500/20',
  dropped: 'bg-red-500/10 text-red-500 border-red-500/20',
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
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
          _count: {
            select: { chapters: true },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  // Group by status
  const grouped = {
    reading: bookmarks.filter((b) => b.status === 'reading'),
    planned: bookmarks.filter((b) => b.status === 'planned'),
    completed: bookmarks.filter((b) => b.status === 'completed'),
    dropped: bookmarks.filter((b) => b.status === 'dropped'),
  }

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
        <div className="space-y-8">
          {(['reading', 'planned', 'completed', 'dropped'] as const).map((status) => (
            grouped[status].length > 0 && (
              <div key={status}>
                <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                  <Badge className={statusColors[status]}>{statusLabels[status]}</Badge>
                  <span className="text-sm text-muted-foreground">
                    ({grouped[status].length})
                  </span>
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {grouped[status].map((bookmark) => (
                    <Link key={bookmark.id} href={`/novel/${bookmark.novel.slug}`}>
                      <Card className="overflow-hidden transition-shadow hover:shadow-lg">
                        <div className="relative aspect-[3/4] bg-muted">
                          {bookmark.novel.coverUrl ? (
                            <Image
                              src={bookmark.novel.coverUrl}
                              alt={bookmark.novel.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <span className="text-4xl">📚</span>
                            </div>
                          )}
                        </div>
                        <CardContent className="p-3">
                          <h3 className="line-clamp-2 text-sm font-medium">
                            {bookmark.novel.title}
                          </h3>
                          {bookmark.novel.originalName && (
                            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground italic">
                              {bookmark.novel.originalName}
                            </p>
                          )}
                          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                            <span>{bookmark.novel._count.chapters} розділів</span>
                            <span>{bookmark.novel.averageRating.toFixed(1)} ★</span>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Додано {formatDate(bookmark.createdAt)}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  )
}
