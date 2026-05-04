import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, BookOpen, CalendarClock, Library, Users } from 'lucide-react'
import JoinTeamButton from '@/components/join-team-button'
import AddTeamMember from '@/components/add-team-member'
import LeaveTeamButton from '@/components/leave-team-button'
import TeamSettings from '@/components/team-settings'
import TeamFollowButton from '@/components/team-follow-button'
import TeamJoinRequests from '@/components/team-join-requests'
import UserPresence, { OnlineDot } from '@/components/user-presence'

interface TeamPageProps {
  params: Promise<{ slug: string }>
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('uk-UA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export async function generateMetadata({ params }: TeamPageProps) {
  const { slug } = await params
  const team = await prisma.team.findUnique({
    where: { slug },
  })

  if (!team) return { title: 'Команда не знайдена' }
  const description = team.description || `Команда перекладу ${team.name} на honni`
  return {
    title: `${team.name} — команда перекладу`,
    description: description.slice(0, 160),
    alternates: { canonical: `/team/${team.slug}` },
    openGraph: {
      type: 'profile',
      title: `${team.name} — honni`,
      description: description.slice(0, 160),
      url: `/team/${team.slug}`,
      images: team.bannerUrl || team.avatarUrl ? [{ url: team.bannerUrl || team.avatarUrl!, alt: team.name }] : undefined,
    },
  }
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { slug } = await params
  const session = await auth()

  const team = await prisma.team.findUnique({
    where: { slug },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true, lastSeen: true },
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

  const isMember = team.members.some((m) => m.userId === session?.user?.id)
  const currentMembership = team.members.find(m => m.userId === session?.user?.id)
  const isOwner = currentMembership?.role === 'owner'
  const isAdmin = currentMembership?.role === 'admin'
  const ownPendingJoinRequests = session?.user?.id
    ? await prisma.$queryRaw<{ id: string }[]>`
        SELECT "id" FROM "TeamJoinRequest"
        WHERE "userId" = ${session.user.id}
          AND "teamId" = ${team.id}
          AND "status" = 'PENDING'::"TeamJoinRequestStatus"
        LIMIT 1
      `
    : []
  const hasPendingJoinRequest = ownPendingJoinRequests.length > 0
  const pendingJoinRequests = isOwner || isAdmin
    ? await prisma.$queryRaw<{
        id: string
        createdAt: Date
        userId: string
        userName: string | null
        userEmail: string | null
        userImage: string | null
      }[]>`
        SELECT r."id", r."createdAt", u."id" as "userId", u."name" as "userName", u."email" as "userEmail", u."image" as "userImage"
        FROM "TeamJoinRequest" r
        JOIN "User" u ON u."id" = r."userId"
        WHERE r."teamId" = ${team.id}
          AND r."status" = 'PENDING'::"TeamJoinRequestStatus"
        ORDER BY r."createdAt" ASC
      `
    : []
  const formattedJoinRequests = pendingJoinRequests.map((request) => ({
    id: request.id,
    createdAt: request.createdAt,
    user: {
      id: request.userId,
      name: request.userName,
      email: request.userEmail,
      image: request.userImage,
    },
  }))
  const followRows = session?.user?.id
    ? await prisma.$queryRaw<{ id: string }[]>`
        SELECT "id" FROM "TeamFollow"
        WHERE "userId" = ${session.user.id} AND "teamId" = ${team.id}
        LIMIT 1
      `
    : []
  const isFollowing = followRows.length > 0

  const visibleChapters = isMember
    ? team.chapters
    : team.chapters.filter(c => c.moderationStatus === 'APPROVED')
  const approvedChapters = team.chapters.filter(c => c.moderationStatus === 'APPROVED')
  const pendingChapters = team.chapters.filter(c => c.moderationStatus === 'PENDING')
  const translatedNovelsCount = new Set(approvedChapters.map(chapter => chapter.novelId)).size
  const latestRelease = approvedChapters[0]
  const followerCountRows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint as count FROM "TeamFollow" WHERE "teamId" = ${team.id}
  `
  const followerCount = Number(followerCountRows[0]?.count || 0)
  const recentReleases = approvedChapters.slice(0, 6)

  return (
    <div>
      {team.bannerUrl && (
        <div className="relative h-[300px] w-full overflow-hidden">
          <img
            src={team.bannerUrl}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            {team.avatarUrl ? (
              <img
                src={team.avatarUrl}
                alt={team.name}
                className="h-16 w-16 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-8 w-8 text-primary" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="break-words text-3xl font-bold">{team.name}</h1>
              <div className="mt-1 flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span>{team.members.length} учасник{team.members.length % 10 === 1 && team.members.length % 100 !== 11 ? '' : 'ів'}</span>
                <span>•</span>
                <span>{followerCount} стежать</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {session?.user?.id && (
              <TeamFollowButton teamSlug={team.slug} initialIsFollowing={isFollowing} />
            )}

            {isOwner && (
              <TeamSettings
                teamSlug={team.slug}
                currentAvatar={team.avatarUrl}
                currentBanner={team.bannerUrl}
              />
            )}

            {session && !isMember && (
              <JoinTeamButton teamSlug={team.slug} initialHasPendingRequest={hasPendingJoinRequest} />
            )}

            {isMember && (
              <Badge variant="secondary">Ви в команді</Badge>
            )}
          </div>
        </div>

        {team.description && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Про команду</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{team.description}</p>
            </CardContent>
          </Card>
        )}

        {(isOwner || isAdmin) && (
          <TeamJoinRequests teamSlug={team.slug} requests={formattedJoinRequests} />
        )}

        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <Library className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{translatedNovelsCount}</p>
                <p className="text-sm text-muted-foreground">тайтлів</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-500/10">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{approvedChapters.length}</p>
                <p className="text-sm text-muted-foreground">опублікованих глав</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-500/10">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{followerCount}</p>
                <p className="text-sm text-muted-foreground">підписників</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-orange-500/10">
                <CalendarClock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {latestRelease ? formatDate(latestRelease.createdAt) : 'Немає'}
                </p>
                <p className="text-sm text-muted-foreground">останній реліз</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {recentReleases.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Останні релізи</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentReleases.map((chapter) => {
                const volumePath = chapter.volume ? `${chapter.volume}.` : ''
                const chapterUrl = `/read/${chapter.novel.slug}/${volumePath}${chapter.number}/${team.slug}`

                return (
                  <div key={chapter.id} className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <Link href={`/novel/${chapter.novel.slug}`} className="line-clamp-1 font-medium hover:text-primary">
                        {chapter.novel.title}
                      </Link>
                      <p className="line-clamp-1 text-sm text-muted-foreground">
                        Розділ {chapter.number}: {chapter.title}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 items-center justify-between gap-3 sm:justify-end">
                      <span className="hidden text-sm text-muted-foreground sm:inline">
                        {formatDate(chapter.createdAt)}
                      </span>
                      <Button asChild size="sm" variant="outline">
                        <Link href={chapterUrl}>Читати</Link>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {isMember && pendingChapters.length > 0 && (
          <div className="mb-8 rounded-md border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-700">
            На модерації: {pendingChapters.length} глав
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:flex-col md:items-stretch lg:flex-row lg:items-center">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <Users className="h-5 w-5" />
                Учасники
              </h2>
              {session?.user?.id && isMember && (
                <LeaveTeamButton
                  teamSlug={team.slug}
                  teamName={team.name}
                  isOwner={isOwner}
                />
              )}
            </div>
            {session?.user?.id && isMember ? (
              <AddTeamMember
                teamSlug={team.slug}
                currentUserId={session.user.id}
                members={team.members}
                isOwner={isOwner}
                isAdmin={isAdmin}
              />
            ) : (
              <div className="space-y-2">
                {team.members.map((member) => (
                  <Link key={member.id} href={`/user/${member.user.id}`}>
                    <Card className="flex min-w-0 items-center gap-3 p-3 transition-colors hover:bg-muted">
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
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
                        <OnlineDot lastSeen={member.user.lastSeen} className="absolute bottom-0 right-0 h-3 w-3 border-2" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{member.user.name || 'Користувач'}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {member.role === 'owner' ? 'Власник' : member.role === 'admin' ? 'Адмін' : 'Учасник'}
                        </p>
                        <UserPresence lastSeen={member.user.lastSeen} compact />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
              <BookOpen className="h-5 w-5" />
              Переклади ({visibleChapters.length})
            </h2>

            {visibleChapters.length === 0 ? (
              <p className="text-muted-foreground">Поки немає перекладів</p>
            ) : (
              <div className="space-y-2">
                {Object.values(
                  visibleChapters.reduce((acc, chapter) => {
                    const novelId = chapter.novelId
                    if (!acc[novelId]) {
                      acc[novelId] = { novel: chapter.novel, chapters: [] }
                    }
                    acc[novelId].chapters.push(chapter)
                    return acc
                  }, {} as Record<string, { novel: typeof visibleChapters[0]['novel'], chapters: typeof visibleChapters }>)
                ).map(({ novel, chapters }) => (
                  <Card key={novel.id} className="p-4">
                    <div className="flex min-w-0 gap-4">
                      <Link href={`/novel/${novel.slug}`} className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded bg-muted">
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
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link href={`/novel/${novel.slug}`} className="hover:text-primary">
                          <h3 className="line-clamp-2 font-medium">{novel.title}</h3>
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {chapters.filter(c => c.moderationStatus === 'APPROVED').length} з {chapters.length} глав
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {chapters.map((ch) => {
                            const isPending = ch.moderationStatus === 'PENDING'
                            const volStr = ch.volume ? `${ch.volume}.` : ''
                            const chapterUrl = `/read/${novel.slug}/${volStr}${ch.number}`

                            if (isPending && !isMember) {
                              return (
                                <span
                                  key={ch.id}
                                  className="inline-flex items-center px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800"
                                >
                                  {ch.number}
                                  <span className="ml-1">На модерації</span>
                                </span>
                              )
                            }

                            return (
                              <Link key={ch.id} href={chapterUrl}>
                                <Badge
                                  variant="outline"
                                  className="text-xs cursor-pointer hover:bg-muted"
                                >
                                  {ch.number}
                                </Badge>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
