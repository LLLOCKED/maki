'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { BookOpen, ArrowUpDown, ArrowUp, ArrowDown, Users, Clock, Pencil } from 'lucide-react'

interface Chapter {
  id: string
  title: string
  number: number
  volume: number | null
  createdAt: Date
  teamId: string | null
  moderationStatus?: string
  team?: {
    id: string
    name: string
    slug: string
  } | null
}

interface ChapterListProps {
  novelSlug: string
  chapters: Chapter[]
  isTeamMember?: boolean
  teamSlugs?: string[]
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'short',
  })
}

export default function ChapterList({ novelSlug, chapters, isTeamMember, teamSlugs = [] }: ChapterListProps) {
  const router = useRouter()
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const sortedChapters = [...chapters].sort((a, b) => {
    return sortOrder === 'asc' ? a.number - b.number : b.number - a.number
  })

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Розділи ({chapters.length})</h2>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowUpDown className="h-4 w-4" />
              {sortOrder === 'asc' ? 'Спочатку старі' : 'Спочатку нові'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => setSortOrder('asc')}
              className={sortOrder === 'asc' ? 'bg-accent' : ''}
            >
              <ArrowUp className="mr-2 h-4 w-4" />
              Спочатку старі
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSortOrder('desc')}
              className={sortOrder === 'desc' ? 'bg-accent' : ''}
            >
              <ArrowDown className="mr-2 h-4 w-4" />
              Спочатку нові
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {sortedChapters.length === 0 ? (
        <p className="text-muted-foreground">Розділів поки що немає</p>
      ) : (
        <div className="grid gap-2">
          {sortedChapters.map((chapter) => {
            const volumeStr = chapter.volume ? `${chapter.volume}.` : ''
            const chapterPath = chapter.team?.slug
              ? `/read/${novelSlug}/${volumeStr}${chapter.number}/${chapter.team.slug}`
              : `/read/${novelSlug}/${volumeStr}${chapter.number}`
            return (
              <Link key={chapter.id} href={chapterPath}>
                <Card className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50">
                  <div>
                    <span className="text-sm text-muted-foreground">
                      {chapter.volume ? `Том ${chapter.volume} Розділ ${chapter.number}` : `Розділ ${chapter.number}`}
                    </span>
                    <h3 className="font-medium">
                      {chapter.title}
                      {chapter.moderationStatus === 'PENDING' && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                          На модерації
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatDate(chapter.createdAt)}</span>
                      {chapter.team && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {chapter.team.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isTeamMember && chapter.teamId && teamSlugs.includes(chapter.team?.slug || '') && (
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          router.push(`/read/${novelSlug}/edit/${chapter.volume ? `${chapter.volume}.` : ''}${chapter.number}/${chapter.team?.slug}`)
                        }}
                        className="rounded-md p-2 hover:bg-muted"
                        title="Редагувати"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </button>
                    )}
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
