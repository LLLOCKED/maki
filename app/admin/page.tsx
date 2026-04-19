import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Shield, BookOpen, FileText, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const sessionWithRole = session as { user: { id: string; role?: string } }
  const role = sessionWithRole.user.role
  if (!['OWNER', 'ADMIN', 'MODERATOR'].includes(role || '')) {
    notFound()
  }

  const [pendingNovels, pendingChapters] = await Promise.all([
    prisma.novel.findMany({
      where: { moderationStatus: 'PENDING' },
      select: { id: true, title: true, slug: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.chapter.findMany({
      where: { moderationStatus: 'PENDING' },
      select: { id: true, title: true, number: true, createdAt: true, novelId: true, novel: { select: { slug: true, title: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  const [novelsCount, chaptersCount] = await Promise.all([
    prisma.novel.count({ where: { moderationStatus: 'PENDING' } }),
    prisma.chapter.count({ where: { moderationStatus: 'PENDING' } }),
  ])

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Адмінка</h1>
          <p className="text-muted-foreground">Модерація контенту</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Новели на перевірці</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{novelsCount}</div>
            <Link
              href="/admin/novels"
              className="text-xs text-primary hover:underline"
            >
              Переглянути всі →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Розділи на перевірці</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chaptersCount}</div>
            <Link
              href="/admin/chapters"
              className="text-xs text-primary hover:underline"
            >
              Переглянути всі →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Pending Items */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Novels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Останні новели
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingNovels.length === 0 ? (
              <p className="text-sm text-muted-foreground">Немає нвелів на перевірці</p>
            ) : (
              <div className="space-y-3">
                {pendingNovels.map((novel) => (
                  <div key={novel.id} className="flex items-center justify-between">
                    <Link
                      href={`/admin/novels?id=${novel.id}`}
                      className="text-sm hover:text-primary"
                    >
                      {novel.title}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Chapters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Останні розділи
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingChapters.length === 0 ? (
              <p className="text-sm text-muted-foreground">Немає розділів на перевірці</p>
            ) : (
              <div className="space-y-3">
                {pendingChapters.map((chapter) => (
                  <div key={chapter.id} className="flex items-center justify-between">
                    <Link
                      href={`/novel/${chapter.novel?.slug || ''}`}
                      className="text-sm hover:text-primary"
                    >
                      {chapter.title} (#{chapter.number})
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}