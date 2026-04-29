import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import ReaderClient from '@/components/reader-client'
import TranslationSelector from '@/components/translation-selector'
import ChapterDropdown from '@/components/chapter-dropdown'

interface ReaderPageProps {
  params: Promise<{
    slug: string
    path: string[]
  }>
}

async function parsePath(pathParts: string[]) {
  // Path format: [volume.]chapter[/team-slug]
  // Examples: "5" -> { volume: null, chapter: 5, teamSlug: null }
  //           "1.5" -> { volume: 1, chapter: 5, teamSlug: null }
  //           "1.5/koreec" -> { volume: 1, chapter: 5, teamSlug: 'koreec' }
  //           "5/koreec" -> { volume: null, chapter: 5, teamSlug: 'koreec' }

  if (pathParts.length === 0) return null

  const lastPart = pathParts[pathParts.length - 1]
  let teamSlug: string | null = null
  let chapterPart = lastPart

  if (pathParts.length > 1) {
    teamSlug = pathParts[pathParts.length - 1]
    chapterPart = pathParts[pathParts.length - 2]
  }

  const match = chapterPart.match(/^(\d+)\.(\d+)$/)
  let volume: number | null = null
  let chapterNumber: number

  if (match) {
    volume = parseInt(match[1])
    chapterNumber = parseInt(match[2])
  } else {
    chapterNumber = parseInt(chapterPart)
  }

  if (isNaN(chapterNumber) || chapterNumber < 1) return null

  return { volume, chapterNumber, teamSlug }
}

function formatChapterUrl(novelSlug: string, number: number, volume: number | null, teamSlug: string | null): string {
  const volStr = volume ? `${volume}.` : ''
  const teamPath = teamSlug ? `/${teamSlug}` : ''
  return `/read/${novelSlug}/${volStr}${number}${teamPath}`
}

export async function generateMetadata({ params }: ReaderPageProps) {
  const { slug, path: pathParts } = await params
  const parsed = await parsePath(pathParts)

  if (!parsed) return { title: 'Не найдено' }

  const { volume, chapterNumber, teamSlug } = parsed
  const chapter = await prisma.chapter.findFirst({
    where: {
      novel: { slug },
      number: chapterNumber,
      ...(volume !== null && { volume }),
      ...(teamSlug && { team: { slug: teamSlug } }),
      moderationStatus: 'APPROVED',
    },
    include: { novel: { select: { title: true } } },
  })

  if (!chapter) return { title: 'Не найдено' }

  return {
    title: `${chapter.title} — ${chapter.novel.title} — honni`,
  }
}

export default async function ReaderPage({ params }: ReaderPageProps) {
  const { slug, path: pathParts } = await params
  const parsed = await parsePath(pathParts)

  if (!parsed) {
    notFound()
  }

  const { volume, chapterNumber, teamSlug } = parsed
  const session = await auth()
  const sessionWithRole = session as { user?: { id?: string; role?: string } } | null
  const userRole = sessionWithRole?.user?.role
  const isAdmin = ['OWNER', 'ADMIN', 'MODERATOR'].includes(userRole || '')

  // Find team by slug if provided
  let teamId: string | null = null
  if (teamSlug) {
    const team = await prisma.team.findUnique({
      where: { slug: teamSlug },
      select: { id: true },
    })
    teamId = team?.id || null
  }

  // Check if user is a member of the team (to view PENDING chapters)
  let isTeamMember = false
  if (teamId && session?.user?.id) {
    const membership = await prisma.teamMembership.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId,
        },
      },
    })
    isTeamMember = !!membership
  }

  // Find the novel
  const novel = await prisma.novel.findUnique({
    where: isAdmin ? { slug } : { slug, moderationStatus: 'APPROVED' },
    select: { id: true, title: true, slug: true },
  })

  if (!novel) {
    notFound()
  }

  // Find chapters matching
  const chapterWhere: any = {
    novelId: novel.id,
    number: chapterNumber,
    ...(volume !== null && { volume }),
  }
  if (!isAdmin) {
    chapterWhere.moderationStatus = 'APPROVED'
  }

  const chapters = await prisma.chapter.findMany({
    where: chapterWhere,
    include: {
      team: { select: { id: true, name: true, slug: true } },
    },
  })

  if (chapters.length === 0) {
    notFound()
  }

  // If teamSlug was specified, filter to that team
  const filteredChapters = teamSlug
    ? chapters.filter(c => c.team?.slug === teamSlug)
    : chapters

  const selectedChapter = filteredChapters[0] || chapters[0]
  const selectedTeamSlug = selectedChapter.team?.slug || null
  const selectedVolume = selectedChapter.volume || null
  const currentTeamId = selectedChapter.teamId

  // Get all chapters for navigation (from same team if applicable)
  const allChaptersWhere: any = {
    novelId: novel.id,
    moderationStatus: isAdmin ? undefined : 'APPROVED',
  }
  if (currentTeamId) {
    allChaptersWhere.teamId = currentTeamId
  }

  const allChaptersForNav = await prisma.chapter.findMany({
    where: allChaptersWhere,
    orderBy: [{ volume: 'asc' }, { number: 'asc' }],
    select: { id: true, number: true, volume: true, teamId: true, title: true, team: { select: { slug: true, name: true, id: true } } },
  })

  // Find prev/next
  const currentIndex = allChaptersForNav.findIndex(c => c.id === selectedChapter.id)
  const prevChapter = currentIndex > 0 ? allChaptersForNav[currentIndex - 1] : null
  const nextChapter = currentIndex < allChaptersForNav.length - 1 ? allChaptersForNav[currentIndex + 1] : null

  // Get all translations of same chapter number (all teams)
  const allTranslationsWhere: any = {
    novelId: novel.id,
    number: chapterNumber,
    ...(volume !== null && { volume }),
  }
  if (!isAdmin) {
    allTranslationsWhere.moderationStatus = 'APPROVED'
  }
  const allTranslations = await prisma.chapter.findMany({
    where: allTranslationsWhere,
    include: {
      team: { select: { id: true, name: true, slug: true } },
    },
  })

  const prevUrl = prevChapter
    ? formatChapterUrl(novel.slug, prevChapter.number, prevChapter.volume || null, prevChapter.team?.slug || null)
    : null
  const nextUrl = nextChapter
    ? formatChapterUrl(novel.slug, nextChapter.number, nextChapter.volume || null, nextChapter.team?.slug || null)
    : null

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/novel/${novel.slug}`}>
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Назад
                </Button>
              </Link>
              <h1 className="text-sm font-medium">{novel.title}</h1>
            </div>

            {/* Translation selector */}
            {allTranslations.length > 1 && (
              <TranslationSelector
                translations={allTranslations as any}
                selectedId={selectedChapter.id}
                novelSlug={novel.slug}
              />
            )}
          </div>

          {/* Chapter dropdown - full width on mobile */}
          <div className="mt-2 w-full sm:mt-0 sm:flex-none">
            <ChapterDropdown
              chapters={allChaptersForNav as any}
              selectedId={selectedChapter.id}
              novelSlug={novel.slug}
            />
          </div>
        </div>
      </div>

      {/* Reader content */}
      <ReaderClient
        chapters={[selectedChapter]}
        teamChapters={allChaptersForNav as any}
        allTranslations={allTranslations as any}
        initialChapterId={selectedChapter.id}
        novelSlug={novel.slug}
        novelId={novel.id}
        chapterNumber={chapterNumber}
        currentChapter={currentIndex + 1}
        totalChapters={allChaptersForNav.length}
        hasPrevChapter={!!prevChapter}
        hasNextChapter={!!nextChapter}
        prevChapterId={prevChapter?.id || null}
        prevChapterNumber={prevChapter?.number || null}
        prevChapterVolume={prevChapter?.volume || null}
        prevChapterTeamSlug={prevChapter?.team?.slug || null}
        nextChapterId={nextChapter?.id || null}
        nextChapterNumber={nextChapter?.number || null}
        nextChapterVolume={nextChapter?.volume || null}
        nextChapterTeamSlug={nextChapter?.team?.slug || null}
        overallProgress={`${currentIndex + 1} з ${allChaptersForNav.length}`}
      />
    </div>
  )
}
