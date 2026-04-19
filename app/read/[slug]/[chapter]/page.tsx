import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import ReaderClient from '@/components/reader-client'

interface ReaderPageProps {
  params: {
    slug: string
    chapter: string
  }
  searchParams: { chapter?: string }
}

async function getChapter(slug: string, chapterNumber: number, teamId?: string | null, isAdmin: boolean = false, isTeamMember: boolean = false) {
  const novelWhere = isAdmin ? { slug } : { slug, moderationStatus: 'APPROVED' }
  const novel = await prisma.novel.findUnique({
    where: novelWhere,
    include: {
      chapters: {
        orderBy: { number: 'asc' },
        select: { id: true, number: true },
      },
    },
  })

  if (!novel) return null

  // Team members can see PENDING chapters from their team
  const chapterWhere = isAdmin
    ? { novelId: novel.id, number: chapterNumber }
    : isTeamMember
      ? { novelId: novel.id, number: chapterNumber, teamId: teamId || undefined }
      : { novelId: novel.id, number: chapterNumber, moderationStatus: 'APPROVED' }

  const chapters = await prisma.chapter.findMany({
    where: chapterWhere,
    select: {
      id: true,
      title: true,
      number: true,
      content: true,
      teamId: true,
      team: {
        select: { id: true, name: true },
      },
    },
  })

  // Get all chapters from the same team for navigation
  let teamChapters: typeof chapters = []
  if (teamId) {
    const teamChapterWhere = isAdmin
      ? { novelId: novel.id, teamId: teamId }
      : isTeamMember
        ? { novelId: novel.id, teamId: teamId }
        : { novelId: novel.id, teamId: teamId, moderationStatus: 'APPROVED' }
    teamChapters = await prisma.chapter.findMany({
      where: teamChapterWhere,
      orderBy: { number: 'asc' },
      select: {
        id: true,
        title: true,
        number: true,
        content: true,
        teamId: true,
        team: {
          select: { id: true, name: true },
        },
      },
    })
  }

  // Get all translations of this chapter (all teams) for the translation selector
  const allTranslationsWhere = isAdmin
    ? { novelId: novel.id, number: chapterNumber }
    : { novelId: novel.id, number: chapterNumber, moderationStatus: 'APPROVED' }
  const allTranslations = await prisma.chapter.findMany({
    where: allTranslationsWhere,
    select: {
      id: true,
      title: true,
      number: true,
      content: true,
      teamId: true,
      team: {
        select: { id: true, name: true },
      },
    },
  })

  return {
    chapters,
    novel,
    chapterNumbers: novel.chapters,
    teamChapters: teamChapters.length > 0 ? teamChapters : chapters,
    allTranslations,
  }
}

export async function generateMetadata({ params }: ReaderPageProps) {
  const chapterNum = parseInt(params.chapter)
  const data = await getChapter(params.slug, chapterNum)

  if (!data || data.chapters.length === 0) return { title: 'Не найдено' }

  return {
    title: `${data.chapters[0].title} — ${data.novel.title} — RanobeHub`,
  }
}

export default async function ReaderPage({ params, searchParams }: ReaderPageProps) {
  const session = await auth()
  const sessionWithRole = session as { user?: { id?: string; role?: string } } | null
  const userRole = sessionWithRole?.user?.role
  const isAdmin = ['OWNER', 'ADMIN', 'MODERATOR'].includes(userRole || '')
  const chapterNum = parseInt(params.chapter)

  // If a specific chapter ID is requested, get the team for that chapter first
  let teamId: string | null | undefined
  if (searchParams.chapter) {
    const directChapter = await prisma.chapter.findUnique({
      where: { id: searchParams.chapter },
      select: { teamId: true },
    })
    teamId = directChapter?.teamId
  }

  // Check if user is a member of the team (to view PENDING chapters)
  let isTeamMember = false
  if (teamId && session?.user?.id) {
    const membership = await prisma.teamMembership.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId: teamId,
        },
      },
    })
    isTeamMember = !!membership
  }

  const data = await getChapter(params.slug, chapterNum, teamId, isAdmin, isTeamMember)

  if (!data || data.chapters.length === 0) {
    notFound()
  }

  const { chapters, novel, chapterNumbers, teamChapters, allTranslations } = data

  // Find current position in team's chapters
  const selectedChapterId = searchParams.chapter && chapters.find(c => c.id === searchParams.chapter)
    ? searchParams.chapter
    : chapters[0]?.id

  const selectedChapter = chapters.find(c => c.id === selectedChapterId)
  const currentTeamId = selectedChapter?.teamId

  // Calculate navigation within team's chapters
  const teamChapterIndex = teamChapters.findIndex(c => c.number === chapterNum && c.teamId === currentTeamId)
  const hasPrevChapter = teamChapterIndex > 0
  const hasNextChapter = teamChapterIndex < teamChapters.length - 1
  const prevChapter = hasPrevChapter ? teamChapters[teamChapterIndex - 1] : null
  const nextChapter = hasNextChapter ? teamChapters[teamChapterIndex + 1] : null

  // Overall progress (all chapters regardless of team)
  const currentOverallIndex = chapterNumbers.findIndex((c) => c.number === chapterNum)
  const totalOverall = chapterNumbers.length

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href={`/novel/${novel.slug}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-1 h-4 w-4" />
                К новелле
              </Button>
            </Link>
            <div>
              <h1 className="font-semibold">{novel.title}</h1>
              <p className="text-xs text-muted-foreground">
                Глава {chapterNum}: {selectedChapter?.title || chapters[0].title}
              </p>
            </div>
          </div>
        </div>
      </header>

      <ReaderClient
        {...{
          chapters: teamChapters,
          teamChapters: teamChapters,
          allTranslations,
          initialChapterId: selectedChapterId,
          novelSlug: novel.slug,
          chapterNumber: chapterNum,
          currentChapter: currentOverallIndex,
          totalChapters: totalOverall,
          hasPrevChapter,
          hasNextChapter,
          prevChapterId: prevChapter?.id || null,
          prevChapterNumber: prevChapter?.number || null,
          nextChapterId: nextChapter?.id || null,
          nextChapterNumber: nextChapter?.number || null,
          overallProgress: `${currentOverallIndex + 1} з ${totalOverall}`,
        } as any}
      />
    </div>
  )
}