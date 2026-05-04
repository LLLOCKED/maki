import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Shield, BookOpen, FileText, Clock, Settings, Users, MessageSquare, UserCheck, Activity, Search, UserX, Megaphone, AlertTriangle } from 'lucide-react'
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

  const isOwner = role === 'OWNER'

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

  const [
    pendingNovelsCount,
    pendingChaptersCount,
    usersCount,
    novelsCount,
    chaptersCount,
    activeUsersCount,
    commentsCount,
    openReportsCount,
    uniqueVisitorsCount, // Add this
    recentNovels,
    recentChapters,
  ] = await Promise.all([
    prisma.novel.count({ where: { moderationStatus: 'PENDING' } }),
    prisma.chapter.count({ where: { moderationStatus: 'PENDING' } }),
    prisma.user.count(),
    prisma.novel.count(),
    prisma.chapter.count(),
    prisma.user.count({ where: { lastSeen: { gte: fiveMinutesAgo } } }),
    prisma.comment.count(),
    prisma.contentReport.count({ where: { status: 'OPEN' } }),
    prisma.novelView.groupBy({ // Aggregate unique visitors for today
      by: ['ipAddress'],
      where: {
        viewedDate: new Date(),
      },
    }).then(res => res.length),
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Унікальні відвідувачі</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueVisitorsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Користувачі</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Активні (5 хв)</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsersCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Новели</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{novelsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Розділи</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chaptersCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Moderation */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">На перевірці: новели</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{pendingNovelsCount}</div>
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
            <CardTitle className="text-sm font-medium">На перевірці: розділи</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{pendingChaptersCount}</div>
            <Link
              href="/admin/chapters"
              className="text-xs text-primary hover:underline"
            >
              Переглянути всі →
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Коментарі</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{commentsCount}</div>
          </CardContent>
        </Card>
        <Link href="/admin/reports">
          <Card className="transition-colors hover:border-primary">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Нові скарги</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openReportsCount}</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {isOwner && (
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Link href="/admin/settings">
            <Card className="hover:border-primary transition-colors">
              <CardContent className="flex items-center gap-4 p-4">
                <Settings className="h-8 w-8 text-muted-foreground" />
                <div>
                  <CardTitle className="text-base">Налаштування сайту</CardTitle>
                  <p className="text-sm text-muted-foreground">Жанри та категорії форуму</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/activity">
            <Card className="hover:border-primary transition-colors">
              <CardContent className="flex items-center gap-4 p-4">
                <Activity className="h-8 w-8 text-muted-foreground" />
                <div>
                  <CardTitle className="text-base">Журнал активності</CardTitle>
                  <p className="text-sm text-muted-foreground">Дії адмінів та модераторів</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/users">
            <Card className="hover:border-primary transition-colors">
              <CardContent className="flex items-center gap-4 p-4">
                <UserX className="h-8 w-8 text-muted-foreground" />
                <div>
                  <CardTitle className="text-base">Користувачі</CardTitle>
                  <p className="text-sm text-muted-foreground">Бани та попередження</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/announcements">
            <Card className="hover:border-primary transition-colors">
              <CardContent className="flex items-center gap-4 p-4">
                <Megaphone className="h-8 w-8 text-muted-foreground" />
                <div>
                  <CardTitle className="text-base">Оголошення</CardTitle>
                  <p className="text-sm text-muted-foreground">Керування каруселлю</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/reports">
            <Card className="hover:border-primary transition-colors">
              <CardContent className="flex items-center gap-4 p-4">
                <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                <div>
                  <CardTitle className="text-base">Скарги</CardTitle>
                  <p className="text-sm text-muted-foreground">Скарги на тайтли та розділи</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {isOwner && (
        <div className="mb-8">
          <Link href="/admin/seo">
            <Card className="hover:border-primary transition-colors">
              <CardContent className="flex items-center gap-4 p-4">
                <Search className="h-8 w-8 text-muted-foreground" />
                <div>
                  <CardTitle className="text-base">SEO дашборд</CardTitle>
                  <p className="text-sm text-muted-foreground">Статистика та оптимізація</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

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
            {recentNovels.length === 0 ? (
              <p className="text-sm text-muted-foreground">Немає нвелів на перевірці</p>
            ) : (
              <div className="space-y-3">
                {recentNovels.map((novel) => (
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
            {recentChapters.length === 0 ? (
              <p className="text-sm text-muted-foreground">Немає розділів на перевірці</p>
            ) : (
              <div className="space-y-3">
                {recentChapters.map((chapter) => (
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
