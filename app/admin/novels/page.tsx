import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import NovelModerationList from '@/components/admin/novel-moderation-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminNovelsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const role = (session as { user: { role?: string } }).user?.role
  if (!['OWNER', 'ADMIN', 'MODERATOR'].includes(role || '')) {
    notFound()
  }

  const novels = await prisma.novel.findMany({
    where: { moderationStatus: 'PENDING' },
    include: {
      authors: { include: { author: true } },
      genres: { include: { genre: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Модерація новел</CardTitle>
        </CardHeader>
        <CardContent>
          {novels.length === 0 ? (
            <p className="text-muted-foreground">Немає новел на перевірці</p>
          ) : (
            <NovelModerationList novels={novels as any} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
