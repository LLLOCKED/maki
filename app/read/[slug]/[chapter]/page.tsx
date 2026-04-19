import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
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

async function getChapter(slug: string, chapterNumber: number, teamId?: string | null) {
  const novel = await prisma.novel.findUnique({
    where: { slug },
    include: {
      chapters: {
        orderBy: { number: 'asc' },
        select: { id: true, number: true },
      },
    },
  })

  if (!novel) return null

  const chapters = await prisma.chapter.findMany({
    where: {
      novelId: novel.id,
      number: chapterNumber,
    },
    include: {
      team: {
        select: { id: true, name: true },
      },
    },
  })

  // Get all chapters from the same team for navigation
  let teamChapters: typeof chapters = []
  if (teamId) {
    teamChapters = await prisma.chapter.findMany({
      where: {
        novelId: novel.id,
        teamId: teamId,
      },
      orderBy: { number: 'asc' },
      include: {
        team: {
          select: { id: true, name: true },
        },
      },
    })
  }

  return { chapters, novel, chapterNumbers: novel.chapters, teamChapters }
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

  const data = await getChapter(params.slug, chapterNum, teamId)

  if (!data || data.chapters.length === 0) {
    notFound()
  }

  const { chapters, novel, chapterNumbers, teamChapters } = data

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

      {/* Reader */}
      <ReaderClient
        chapters={chapters}
        teamChapters={teamChapters}
        initialChapterId={selectedChapterId}
        novelSlug={novel.slug}
        chapterNumber={chapterNum}
        currentChapter={teamChapterIndex + 1}
        totalChapters={teamChapters.length}
        hasPrevChapter={hasPrevChapter}
        hasNextChapter={hasNextChapter}
        prevChapterId={prevChapter?.id || null}
        prevChapterNumber={prevChapter?.number || null}
        nextChapterId={nextChapter?.id || null}
        nextChapterNumber={nextChapter?.number || null}
        overallProgress={`${currentOverallIndex + 1}/${totalOverall}`}
      />
    </div>
  )
}
