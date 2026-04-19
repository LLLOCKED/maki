import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Users } from 'lucide-react'
import ProfileSettings from '@/components/settings/profile-settings'

export default async function SettingsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/')
  }

  const teams = await prisma.teamMembership.findMany({
    where: { userId: session.user.id },
    include: {
      team: {
        include: {
          _count: {
            select: {
              members: true,
              chapters: true,
            },
          },
        },
      },
    },
  })

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Налаштування</h1>

      <div className="space-y-6">
        {/* Profile Settings */}
        <ProfileSettings />

        {/* Teams */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Мої команди
            </CardTitle>
            <CardDescription>
              Команди, в яких ви бракуєте участь
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {teams.length === 0 ? (
              <p className="text-muted-foreground">Ви ще не в жодній команді</p>
            ) : (
              <div className="space-y-3">
                {teams.map(({ team, role }) => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{team.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {team._count.members} учасників · {team._count.chapters} розділів
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground capitalize">
                      {role === 'owner' ? 'Власник' : role === 'admin' ? 'Адмін' : 'Учасник'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <Link href="/admin/teams/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Створити команду
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Admin Links */}
        <Card>
          <CardHeader>
            <CardTitle>Адміністрування</CardTitle>
            <CardDescription>Управління контентом</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/novels/new">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Plus className="h-4 w-4" />
                Додати новелу
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}