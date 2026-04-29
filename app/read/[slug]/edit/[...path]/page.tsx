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

  // Parse chapter from path: /read/slug/edit/2.5/team-slug or /read/slug/edit/5
  const editIndex = path.indexOf('edit')
  const chapterPath = editIndex !== -1 ? path.slice(0, editIndex) : path

  const lastPart = chapterPath[chapterPath.length - 1]
  let chapterNumber = parseInt(lastPart)
  let volume: number | null = null

  if (lastPart.includes('.')) {
    const [v, n] = lastPart.split('.')
    volume = parseInt(v)
    chapterNumber = parseInt(n)
  }

  const novel = await prisma.novel.findUnique({
    where: { slug },
    select: { title: true },
  })

  return {
    title: `Редагування розділу ${chapterNumber} — ${novel?.title || ''} — honni`,
  }
}

export default async function EditChapterPage({ params }: EditChapterPageProps) {
  const { slug, path } = await params
  const session = await auth()
  const sessionWithRole = session as { user?: { id?: string; role?: string } } | null

  if (!session?.user?.id) {
    redirect('/login')
  }

  // Parse chapter from path: /read/slug/edit/2.5/team-slug or /read/slug/edit/5
  const editIndex = path.indexOf('edit')
  const chapterPath = editIndex !== -1 ? path.slice(0, editIndex) : path

  const lastPart = chapterPath[chapterPath.length - 1]
  let chapterNumber = parseInt(lastPart)
  let volume: number | null = null
  let teamSlug: string | null = null

  if (chapterPath.length > 1) {
    teamSlug = chapterPath[chapterPath.length - 1]
    chapterNumber = parseInt(chapterPath[chapterPath.length - 2])
  }

  if (lastPart.includes('.')) {
    const [v, n] = lastPart.split('.')
    volume = parseInt(v)
    chapterNumber = parseInt(n)
    if (chapterPath.length > 1) {
      teamSlug = chapterPath[chapterPath.length - 1]
    }
  }

  // Find the chapter
  const novel = await prisma.novel.findUnique({
    where: { slug },
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
      ...(volume !== null && { volume }),
      ...(teamSlug && team ? { teamId: team.id } : {}),
    },
  })

  if (!chapter) {
    notFound()
  }

  // Check if user is team member (for non-admin editing)
  let isTeamMember = false
  if (team && session?.user?.id) {
    const membership = await prisma.teamMembership.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId: team.id,
        },
      },
    })
    isTeamMember = !!membership
  }

  const isAdmin = ['OWNER', 'ADMIN', 'MODERATOR'].includes(sessionWithRole?.user?.role || '')

  if (!isAdmin && !isTeamMember) {
    redirect(`/read/${slug}/${volume ? `${volume}.` : ''}${chapterNumber}${teamSlug ? `/${teamSlug}` : ''}`)
  }

  const volStr = volume ? `${volume}.` : ''
  const teamPath = teamSlug ? `/${teamSlug}` : ''

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
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