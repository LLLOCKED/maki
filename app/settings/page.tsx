import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Users } from 'lucide-react'

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
      <h1 className="mb-8 text-3xl font-bold">Settings</h1>

      <div className="space-y-6">
        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-lg font-medium">
                {session.user.name?.[0] || 'U'}
              </div>
              <div>
                <p className="font-medium">{session.user.name || 'Anonymous'}</p>
                <p className="text-sm text-muted-foreground">{session.user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teams */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              My teams
            </CardTitle>
            <CardDescription>
              Teams you are member of
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {teams.length === 0 ? (
              <p className="text-muted-foreground">You are not in any team yet</p>
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
                        {team._count.members} members · {team._count.chapters} chapters
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground capitalize">
                      {role === 'owner' ? 'Owner' : role}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <Link href="/admin/teams/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create team
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Admin Links */}
        <Card>
          <CardHeader>
            <CardTitle>Administration</CardTitle>
            <CardDescription>Content management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/novels/new">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Plus className="h-4 w-4" />
                Add novel
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
