import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import NotificationsList from '@/components/notifications-list'
import { Card, CardContent } from '@/components/ui/card'
import { Bell } from 'lucide-react'

export const metadata = {
  title: 'Сповіщення — honni',
}

export default async function NotificationsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    include: {
      novel: {
        select: { id: true, title: true, slug: true },
      },
      chapter: {
        select: { id: true, number: true, volume: true },
      },
      team: {
        select: { id: true, name: true, slug: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardContent className="pt-6">
          <NotificationsList
            initialNotifications={notifications.map(n => ({
              ...n,
              createdAt: n.createdAt.toISOString(),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  )
}