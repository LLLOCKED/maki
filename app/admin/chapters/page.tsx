import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ChapterModerationList from '@/components/admin/chapter-moderation-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminChaptersPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const sessionWithRole = session as { user: { id: string; role?: string } }
  const role = sessionWithRole.user.role
  if (!['OWNER', 'ADMIN', 'MODERATOR'].includes(role || '')) {
    notFound()
  }

  const chapters = await prisma.chapter.findMany({
    where: { moderationStatus: 'PENDING' },
    include: {
      novel: {
        select: { id: true, title: true, slug: true },
      },
      team: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Модерація розділів</CardTitle>
        </CardHeader>
        <CardContent>
          <ChapterModerationList chapters={chapters as any} />
        </CardContent>
      </Card>
    </div>
  )
}