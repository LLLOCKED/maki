import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import ChapterEditForm from './edit-form'

interface EditChapterPageProps {
  params: Promise<{ slug: string; path: string[] }>
}

export async function generateMetadata({ params }: EditChapterPageProps) {
  const { slug, path } = await params
  const parsed = parseEditPath(path)

  if (!parsed) return { title: 'Не знайдено' }

  const novel = await prisma.novel.findUnique({
    where: { slug, deletedAt: null },
    select: { title: true },
  })

  return {
    title: `Редагування розділу ${parsed.chapterNumber} — ${novel?.title || ''} — honni`,
  }
}

function parseEditPath(path: string[]) {
  if (path.length === 0) return null

  let teamSlug: string | null = null
  let chapterPart = path[0]

  if (path.length > 1) {
    // If last part is not a number, it's a team slug
    const last = path[path.length - 1]
    if (isNaN(parseFloat(last))) {
      teamSlug = last
      chapterPart = path[path.length - 2]
    } else {
      chapterPart = last
    }
  }

  // Handle Vol.Ch format (e.g. "1.5")
  let volume: number | null = null
  let chapterNumber: number

  // Look for dot in chapterPart to distinguish Vol.Ch
  // Note: this is still slightly ambiguous if chapter itself has a dot but no volume.
  // We assume if there's a dot and the first part is an integer, it's Vol.Ch.
  const dotParts = chapterPart.split('.')
  if (dotParts.length >= 2) {
    const v = parseInt(dotParts[0])
    // Join the rest back in case the chapter number itself has a dot (e.g. 1.102.1 -> Vol 1, Ch 102.1)
    const c = parseFloat(dotParts.slice(1).join('.'))
    if (!isNaN(v) && !isNaN(c)) {
      volume = v
      chapterNumber = c
    } else {
      chapterNumber = parseFloat(chapterPart)
    }
  } else {
    chapterNumber = parseFloat(chapterPart)
  }

  if (isNaN(chapterNumber)) return null

  return { volume, chapterNumber, teamSlug }
}

export default async function EditChapterPage({ params }: EditChapterPageProps) {
  const { slug, path } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const parsed = parseEditPath(path)
  if (!parsed) {
    notFound()
  }

  const { volume, chapterNumber, teamSlug } = parsed

  // Find the novel
  const novel = await prisma.novel.findUnique({
    where: { slug, deletedAt: null },
    select: { id: true, title: true, moderationStatus: true },
  })

  if (!novel) {
    notFound()
  }

  // Find team if slug provided
  let team = null
  if (teamSlug) {
    team = await prisma.team.findUnique({
      where: { slug: teamSlug },
    })
  }

  // Find the chapter
  const chapter = await prisma.chapter.findFirst({
    where: {
      novelId: novel.id,
      number: chapterNumber,
      deletedAt: null,
      ...(volume !== null && { volume }),
      ...(teamSlug && team ? { teamId: team.id } : (teamSlug ? { team: { slug: teamSlug } } : {})),
    },
  })

  if (!chapter) {
    notFound()
  }

  const user = session?.user as { id: string; role?: string } | undefined
  const isAdmin = ['OWNER', 'ADMIN', 'MODERATOR'].includes(user?.role || '')

  // Check if user is team member
  let isTeamMember = false
  if (user?.id) {
    if (chapter.teamId) {
      const membership = await prisma.teamMembership.findUnique({
        where: {
          userId_teamId: {
            userId: user.id,
            teamId: chapter.teamId,
          },
        },
      })
      isTeamMember = !!membership
    } else {
      // If no team, check if user is the novel author
      const novel = await prisma.novel.findUnique({
        where: { id: chapter.novelId },
        select: { authorId: true },
      })
      isTeamMember = novel?.authorId === user.id
    }
  }

  if (!isAdmin && !isTeamMember) {
    redirect(`/read/${slug}/${volume ? `${volume}.` : ''}${chapterNumber}${teamSlug ? `/${teamSlug}` : ''}`)
  }

  const volStr = volume ? `${volume}.` : ''
  const teamPath = teamSlug ? `/${teamSlug}` : ''

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <Link
        href={`/read/${slug}/${volStr}${chapterNumber}${teamPath}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад до читалки
      </Link>

      <h1 className="mb-6 text-2xl font-bold">
        Редагування розділу {chapter.volume ? `Том ${chapter.volume} ` : ''}Розділ {chapter.number}
      </h1>

      <ChapterEditForm chapter={chapter as any} novelSlug={slug} />
    </div>
  )
}
