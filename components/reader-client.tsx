'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import ReaderSettings, { useReaderSettings } from './reader-settings'
import CommentSection from './comment-section'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Users } from 'lucide-react'

interface Chapter {
  id: string
  title: string
  number: number
  content: string
  team: {
    id: string
    name: string
  } | null
}

interface ReaderClientProps {
  chapters: Chapter[]
  teamChapters: Chapter[]
  allTranslations?: Chapter[]
  initialChapterId?: string
  novelSlug: string
  chapterNumber: number
  currentChapter: number
  totalChapters: number
  hasPrevChapter: boolean
  hasNextChapter: boolean
  prevChapterId: string | null
  prevChapterNumber: number | null
  nextChapterId: string | null
  nextChapterNumber: number | null
  overallProgress: string
}

export default function ReaderClient({
  chapters,
  teamChapters,
  allTranslations,
  initialChapterId,
  novelSlug,
  chapterNumber,
  currentChapter,
  totalChapters,
  hasPrevChapter,
  hasNextChapter,
  prevChapterId,
  prevChapterNumber,
  nextChapterId,
  nextChapterNumber,
  overallProgress,
}: ReaderClientProps) {
  const router = useRouter()
  const [selectedChapterId, setSelectedChapterId] = useState(initialChapterId || chapters[0]?.id || '')
  const {
    theme,
    fontSize,
    contentWidth,
    themeClass,
    fontSizeClass,
    contentWidthClass,
    setTheme,
    setFontSize,
    setContentWidth,
  } = useReaderSettings()

  const selectedChapter = chapters.find((c) => c.id === selectedChapterId) || chapters[0]

  // Sync selectedChapterId when initialChapterId changes (e.g., when URL changes)
  useEffect(() => {
    if (initialChapterId && chapters.find(c => c.id === initialChapterId)) {
      setSelectedChapterId(initialChapterId)
    }
  }, [initialChapterId, chapters])

  const handlePrevChapter = () => {
    if (prevChapterId && prevChapterNumber) {
      router.push(`/read/${novelSlug}/${prevChapterNumber}?chapter=${prevChapterId}`)
    }
  }

  const handleNextChapter = () => {
    if (nextChapterId && nextChapterNumber) {
      router.push(`/read/${novelSlug}/${nextChapterNumber}?chapter=${nextChapterId}`)
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <ReaderSettings
        currentTheme={theme}
        currentFontSize={fontSize}
        currentContentWidth={contentWidth}
        onThemeChange={setTheme}
        onFontSizeChange={setFontSize}
        onContentWidthChange={setContentWidth}
        onPrevChapter={handlePrevChapter}
        onNextChapter={handleNextChapter}
        hasPrevChapter={hasPrevChapter}
        hasNextChapter={hasNextChapter}
        currentChapter={chapterNumber}
        totalChapters={totalChapters}
      />

      {/* Translation Selector */}
      {(() => {
        // Use allTranslations if available, otherwise fall back to chapters
        const translationChapters = allTranslations || chapters
        // Group chapters by team, show one button per team
        const teamMap = new Map<string | null, typeof translationChapters>()
        for (const chapter of translationChapters) {
          const key = chapter.team?.id || null
          if (!teamMap.has(key)) {
            teamMap.set(key, [])
          }
          teamMap.get(key)!.push(chapter)
        }
        const teamEntries = Array.from(teamMap.entries())

        // Only show if there's more than one team
        if (teamEntries.length <= 1) return null

        return (
          <div className="border-b bg-muted/30 px-4 py-3">
            <div className="container mx-auto flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Переклад:</span>
              <div className="flex flex-wrap gap-2">
                {teamEntries.map(([teamId, teamChapters]) => {
                  const teamName = teamId ? teamChapters[0].team?.name : null
                  const isSelected = teamChapters.some(c => c.id === selectedChapterId)
                  return (
                    <button
                      key={teamId || 'no-team'}
                      onClick={() => router.push(`/read/${novelSlug}/${teamChapters[0].number}?chapter=${teamChapters[0].id}`)}
                      className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm transition-colors ${
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {teamName ? (
                        <>
                          <Users className="h-3 w-3" />
                          {teamName}
                        </>
                      ) : (
                        'Без команди'
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })()}

      <article
        className={`${themeClass} ${fontSizeClass} flex-1 px-4 py-8 md:px-8`}
      >
        <div className={`mx-auto ${contentWidthClass}`}>
          <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {selectedChapter?.content || ''}
            </ReactMarkdown>
          </div>
        </div>
      </article>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-center gap-4 border-t p-4">
        <Button
          variant="outline"
          onClick={handlePrevChapter}
          disabled={!hasPrevChapter}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Назад
        </Button>
        <span className="text-sm text-muted-foreground">
          {currentChapter}/{totalChapters} ({overallProgress})
        </span>
        <Button
          variant="outline"
          onClick={handleNextChapter}
          disabled={!hasNextChapter}
        >
          Вперед
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      {/* Comments */}
      <div className="container mx-auto px-4 py-8">
        <CommentSection chapterId={selectedChapter?.id || ''} />
      </div>
    </div>
  )
}
