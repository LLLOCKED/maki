'use client'

import { useState } from 'react'
import { Users, Clock } from 'lucide-react'
import ChapterList from './chapter-list'

interface Chapter {
  id: string
  title: string
  number: number
  createdAt: Date
  teamId: string | null
  moderationStatus: string
  team: {
    id: string
    name: string
  } | null
}

interface ChapterTabsProps {
  novelSlug: string
  chapters: Chapter[]
  isAdmin?: boolean
}

export default function ChapterTabs({ novelSlug, chapters, isAdmin = false }: ChapterTabsProps) {
  // Filter chapters: show all for admins, only APPROVED for non-admins
  const visibleChapters = isAdmin
    ? chapters
    : chapters.filter(c => c.moderationStatus === 'APPROVED')

  // Group by team
  const teamMap = new Map<string | null, Chapter[]>()
  for (const chapter of visibleChapters) {
    const key = chapter.teamId
    if (!teamMap.has(key)) {
      teamMap.set(key, [])
    }
    teamMap.get(key)!.push(chapter)
  }

  const entries = Array.from(teamMap.entries())
  const [activeTab, setActiveTab] = useState(entries[0]?.[0] || null)

  // Count pending chapters for admin indicator
  const pendingCount = chapters.filter(c => c.moderationStatus === 'PENDING').length

  return (
    <div>
      {/* Admin notice */}
      {isAdmin && pendingCount > 0 && (
        <div className="mb-4 p-3 bg-muted rounded-lg flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{pendingCount} розділів очікують модерації</span>
          <a href="/admin/chapters" className="text-primary hover:underline ml-auto">
            Переглянути →
          </a>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex items-center gap-2 border-b overflow-x-auto">
        {entries.map(([teamId, teamChapters]) => {
          const teamName = teamId ? teamChapters[0].team?.name : null
          return (
            <button
              key={teamId || 'no-team'}
              onClick={() => setActiveTab(teamId)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === teamId
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {teamName ? (
                <>
                  <Users className="h-4 w-4" />
                  {teamName}
                </>
              ) : (
                'Без команди'
              )}
              <span className="text-xs opacity-60">({teamChapters.length})</span>
            </button>
          )
        })}
      </div>

      {/* Active Chapter List */}
      {entries.map(([teamId, teamChapters]) => {
        if (teamId !== activeTab) return null
        return (
          <ChapterList
            key={teamId || 'no-team'}
            novelSlug={novelSlug}
            chapters={teamChapters}
          />
        )
      })}
    </div>
  )
}
