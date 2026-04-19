'use client'

import { useState } from 'react'
import { Users } from 'lucide-react'
import ChapterList from './chapter-list'

interface Chapter {
  id: string
  title: string
  number: number
  createdAt: Date
  teamId: string | null
  team: {
    id: string
    name: string
  } | null
}

interface ChapterTabsProps {
  novelSlug: string
  chapters: Chapter[]
}

export default function ChapterTabs({ novelSlug, chapters }: ChapterTabsProps) {
  const teamMap = new Map<string | null, Chapter[]>()
  for (const chapter of chapters) {
    const key = chapter.teamId
    if (!teamMap.has(key)) {
      teamMap.set(key, [])
    }
    teamMap.get(key)!.push(chapter)
  }

  const entries = Array.from(teamMap.entries())
  const [activeTab, setActiveTab] = useState(entries[0]?.[0] || null)

  return (
    <div>
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
