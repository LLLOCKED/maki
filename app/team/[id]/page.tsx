import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, BookOpen, Plus } from 'lucide-react'
import JoinTeamButton from '@/components/join-team-button'
import AddTeamMember from '@/components/add-team-member'

interface TeamPageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: TeamPageProps) {
  const team = await prisma.team.findUnique({
    where: { id: params.id },
  })

  if (!team) return { title: 'Команда не найдена' }
  return { title: `${team.name} — RanobeHub` }
}

export default async function TeamPage({ params }: TeamPageProps) {
  const session = await auth()

  const team = await prisma.team.findUnique({
    where: { id: params.id },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
      chapters: {
        include: {
          novel: {
            select: { id: true, slug: true, title: true, coverUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!team) {
    notFound()
  }

  const membership = session?.user?.id
    ? team.members.find((m) => m.userId === session?.user?.id)
    : null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{team.name}</h1>
            <p className="text-muted-foreground">
              {team.members.length} участник{team.members.length % 10 === 1 && team.members.length % 100 !== 11 ? '' : 'ов'}
            </p>
          </div>
        </div>

        {session && !membership && (
          <JoinTeamButton teamId={team.id} />
        )}

        {membership && (
          <Badge variant="secondary">Вы в команде</Badge>
        )}
      </div>

      {team.description && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>О команде</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{team.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-8 md:grid-cols-3">
        {/* Members */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <Users className="h-5 w-5" />
            Участники
          </h2>
          {session?.user?.id && membership ? (
            <AddTeamMember
              teamId={team.id}
              currentUserId={session.user.id}
              members={team.members}
              isOwner={membership.role === 'owner'}
              isAdmin={membership.role === 'admin'}
            />
          ) : (
            <div className="space-y-2">
              {team.members.map((member) => (
                <Link key={member.id} href={`/user/${member.user.id}`}>
                  <Card className="flex items-center gap-3 p-3 transition-colors hover:bg-muted">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      {member.user.image ? (
                        <img
                          src={member.user.image}
                          alt={member.user.name || ''}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-medium">
                          {member.user.name?.[0] || member.user.email?.[0] || '?'}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{member.user.name || 'Пользователь'}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {member.role === 'owner' ? 'Владелец' : member.role === 'admin' ? 'Админ' : 'Участник'}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Translations */}
        <div className="md:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <BookOpen className="h-5 w-5" />
            Переводы ({team.chapters.length})
          </h2>

          {team.chapters.length === 0 ? (
            <p className="text-muted-foreground">Пока нет переводов</p>
          ) : (
            <div className="space-y-2">
              {/* Group chapters by novel */}
              {Object.values(
                team.chapters.reduce((acc, chapter) => {
                  const novelId = chapter.novelId
                  if (!acc[novelId]) {
                    acc[novelId] = { novel: chapter.novel, chapters: [] }
                  }
                  acc[novelId].chapters.push(chapter)
                  return acc
                }, {} as Record<string, { novel: typeof team.chapters[0]['novel'], chapters: typeof team.chapters }>)
              ).map(({ novel, chapters }) => (
                <Card key={novel.id} className="p-4">
                  <Link href={`/novel/${novel.slug}`} className="flex gap-4">
                    <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded bg-muted">
                      {novel.coverUrl ? (
                        <img
                          src={novel.coverUrl}
                          alt={novel.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <BookOpen className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{novel.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {chapters.length} глав
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {chapters.slice(0, 5).map((ch) => (
                          <Badge key={ch.id} variant="outline" className="text-xs">
                            {ch.number}
                          </Badge>
                        ))}
                        {chapters.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{chapters.length - 5}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
