'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, X } from 'lucide-react'

interface Chapter {
  id: string
  number: number
  volume: number | null
  title: string | null
  team: {
    id: string
    name: string
    slug: string
  } | null
}

interface ChapterDropdownProps {
  chapters: Chapter[]
  selectedId: string
  novelSlug: string
}

export default function ChapterDropdown({ chapters, selectedId, novelSlug }: ChapterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedChapter = chapters.find(c => c.id === selectedId)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (chapter: Chapter) => {
    const volStr = chapter.volume ? `${chapter.volume}.` : ''
    const teamPath = chapter.team?.slug ? `/${chapter.team.slug}` : ''
    window.location.href = `/read/${novelSlug}/${volStr}${chapter.number}${teamPath}`
  }

  const groupedChapters = chapters.reduce((acc, chapter) => {
    const vol = chapter.volume || 0
    if (!acc[vol]) acc[vol] = []
    acc[vol].push(chapter)
    return acc
  }, {} as Record<number, Chapter[]>)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full min-w-0 items-center justify-between gap-2 rounded-md border bg-background px-3 py-2 text-sm hover:bg-muted transition-colors"
      >
        <span className="min-w-0 truncate text-left">
          {selectedChapter?.volume ? `Том ${selectedChapter.volume} Розділ ${selectedChapter.number}` : `Розділ ${selectedChapter?.number}`}
          {selectedChapter?.title && ` — ${selectedChapter.title}`}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute inset-x-0 top-full z-[80] mt-1 max-h-96 w-full overflow-y-auto rounded-md border bg-background shadow-lg">
          <div className="sticky top-0 flex items-center justify-between border-b bg-background px-3 py-2">
            <span className="text-sm font-medium">Всі розділи</span>
            <button onClick={() => setIsOpen(false)} className="rounded p-1 hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
          {Object.entries(groupedChapters)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([volume, volsChapters]) => (
              <div key={volume}>
                {Number(volume) > 0 && (
                  <div className="bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                    Том {volume}
                  </div>
                )}
                {volsChapters.map((chapter) => (
                  <button
                    key={chapter.id}
                    onClick={() => handleSelect(chapter)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-muted ${
                      chapter.id === selectedId ? 'bg-primary/10 text-primary' : ''
                    }`}
                  >
                    <div className="font-medium">Розділ {chapter.number}</div>
                    {chapter.title && (
                      <div className="text-xs text-muted-foreground truncate">{chapter.title}</div>
                    )}
                    {chapter.team && (
                      <div className="text-xs text-muted-foreground">{chapter.team.name}</div>
                    )}
                  </button>
                ))}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
