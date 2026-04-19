'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { BookOpen, ArrowUpDown, ArrowUp, ArrowDown, Users } from 'lucide-react'

interface Chapter {
  id: string
  title: string
  number: number
  createdAt: Date
  teamId: string | null
  team?: {
    id: string
    name: string
  } | null
}

interface ChapterListProps {
  novelSlug: string
  chapters: Chapter[]
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'short',
  })
}

export default function ChapterList({ novelSlug, chapters }: ChapterListProps) {
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
          {sortedChapters.map((chapter) => (
            <Link key={chapter.id} href={`/read/${novelSlug}/${chapter.number}?chapter=${chapter.id}`}>
              <Card className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50">
                <div>
                  <span className="text-sm text-muted-foreground">
                    Розділ {chapter.number}
                  </span>
                  <h3 className="font-medium">{chapter.title}</h3>
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
                <BookOpen className="h-5 w-5 text-muted-foreground" />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
