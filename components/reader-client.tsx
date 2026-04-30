'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import ReaderSettings, { useReaderSettings } from './reader-settings'
import CommentSection from './comment-section'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Users } from 'lucide-react'
import SafeMarkdown from '@/components/safe-markdown'

interface Chapter {
  id: string
  title: string
  number: number
  volume: number | null
  content: string
  team: {
    id: string
    name: string
    slug: string
  } | null
}

interface ReaderClientProps {
  chapters: Chapter[]
  teamChapters: Chapter[]
  allTranslations?: Chapter[]
  initialChapterId?: string
  novelSlug: string
  novelId: string
  chapterNumber: number
  currentChapter: number
  totalChapters: number
  hasPrevChapter: boolean
  hasNextChapter: boolean
  prevChapterId: string | null
  prevChapterNumber: number | null
  prevChapterVolume: number | null
  prevChapterTeamSlug: string | null
  nextChapterId: string | null
  nextChapterNumber: number | null
  nextChapterVolume: number | null
  nextChapterTeamSlug: string | null
  overallProgress: string
}

export default function ReaderClient({
  chapters,
  teamChapters,
  allTranslations,
  initialChapterId,
  novelSlug,
  novelId,
  chapterNumber,
  currentChapter,
  totalChapters,
  hasPrevChapter,
  hasNextChapter,
  prevChapterId,
  prevChapterNumber,
  prevChapterVolume,
  prevChapterTeamSlug,
  nextChapterId,
  nextChapterNumber,
  nextChapterVolume,
  nextChapterTeamSlug,
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
    readerFont,
    lineHeight,
    paragraphSpacing,
    readerFontClass,
    lineHeightClass,
    paragraphSpacingClass,
    setTheme,
    setFontSize,
    setContentWidth,
    setReaderFont,
    setLineHeight,
    setParagraphSpacing,
  } = useReaderSettings()

  const selectedChapter = chapters.find((c) => c.id === selectedChapterId) || chapters[0]

  // Sync selectedChapterId when initialChapterId changes (e.g., when URL changes)
  useEffect(() => {
    if (initialChapterId && chapters.find(c => c.id === initialChapterId)) {
      setSelectedChapterId(initialChapterId)
    }
  }, [initialChapterId, chapters])

  // Update reading position in bookmark when chapter changes
  useEffect(() => {
    if (novelId && chapterNumber) {
      fetch('/api/bookmarks/position', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novelId, chapterNumber }),
      }).catch(console.error)
    }
  }, [novelId, chapterNumber])

  const handlePrevChapter = () => {
    if (prevChapterId && prevChapterNumber) {
      const volStr = prevChapterVolume ? `${prevChapterVolume}.` : ''
      const teamPath = prevChapterTeamSlug ? `/${prevChapterTeamSlug}` : ''
      router.push(`/read/${novelSlug}/${volStr}${prevChapterNumber}${teamPath}`)
    }
  }

  const handleNextChapter = () => {
    if (nextChapterId && nextChapterNumber) {
      const volStr = nextChapterVolume ? `${nextChapterVolume}.` : ''
      const teamPath = nextChapterTeamSlug ? `/${nextChapterTeamSlug}` : ''
      router.push(`/read/${novelSlug}/${volStr}${nextChapterNumber}${teamPath}`)
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <ReaderSettings
        currentTheme={theme}
        currentFontSize={fontSize}
        currentContentWidth={contentWidth}
        currentReaderFont={readerFont}
        currentLineHeight={lineHeight}
        currentParagraphSpacing={paragraphSpacing}
        onThemeChange={setTheme}
        onFontSizeChange={setFontSize}
        onContentWidthChange={setContentWidth}
        onReaderFontChange={setReaderFont}
        onLineHeightChange={setLineHeight}
        onParagraphSpacingChange={setParagraphSpacing}
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
                      onClick={() => {
                        const ch = teamChapters[0]
                        const volStr = ch.volume ? `${ch.volume}.` : ''
                        const teamPath = ch.team?.slug ? `/${ch.team.slug}` : ''
                        router.push(`/read/${novelSlug}/${volStr}${ch.number}${teamPath}`)
                      }}
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
        className={`${themeClass} ${fontSizeClass} ${readerFontClass} ${lineHeightClass} ${paragraphSpacingClass} flex-1 px-4 py-8 md:px-8`}
      >
        <div className={`mx-auto ${contentWidthClass}`}>
          <div className="markdown-content">
            <SafeMarkdown>{selectedChapter?.content || ''}</SafeMarkdown>
          </div>
        </div>
      </article>

      {/* Progress Bar */}
      <div className="border-t px-4 py-2">
        <div className="container mx-auto">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {currentChapter} з {totalChapters}
            </span>
            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="absolute left-0 top-0 h-full bg-primary transition-all"
                style={{ width: `${(currentChapter / totalChapters) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {overallProgress}
            </span>
          </div>
        </div>
      </div>

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
