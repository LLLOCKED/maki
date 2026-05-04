'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import ReaderSettings, { useReaderSettings } from './reader-settings'
import CommentSection from './comment-section'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import SafeMarkdown from '@/components/safe-markdown'
import ReportButton from '@/components/report-button'

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
  initialReadingProgress?: number
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
  initialReadingProgress = 0,
}: ReaderClientProps) {
  const router = useRouter()
  const [selectedChapterId, setSelectedChapterId] = useState(initialChapterId || chapters[0]?.id || '')
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isProgressDocked, setIsProgressDocked] = useState(false)
  const hasRestoredScrollRef = useRef(false)
  const progressSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentRef = useRef<HTMLElement | null>(null)
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
  const translationChapters = allTranslations || chapters
  const teamMap = new Map<string | null, typeof translationChapters>()
  for (const chapter of translationChapters) {
    const key = chapter.team?.id || null
    if (!teamMap.has(key)) {
      teamMap.set(key, [])
    }
    teamMap.get(key)!.push(chapter)
  }
  const translationOptions = Array.from(teamMap.entries()).map(([teamId, teamChapters]) => {
    const firstChapter = teamChapters[0]
    const teamName = teamId ? firstChapter.team?.name : null
    return {
      key: teamId || 'no-team',
      label: teamName || 'Без команди',
      selected: teamChapters.some((chapter) => chapter.id === selectedChapterId),
      onSelect: () => {
        const volStr = firstChapter.volume ? `${firstChapter.volume}.` : ''
        const teamPath = firstChapter.team?.slug ? `/${firstChapter.team.slug}` : ''
        router.push(`/read/${novelSlug}/${volStr}${firstChapter.number}${teamPath}`)
      },
    }
  })

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
        body: JSON.stringify({ novelId, chapterNumber, progress: initialReadingProgress }),
      }).catch(console.error)
    }
  }, [novelId, chapterNumber, initialReadingProgress])

  useEffect(() => {
    hasRestoredScrollRef.current = false
  }, [selectedChapterId])

  useEffect(() => {
    const updateProgress = () => {
      const content = contentRef.current
      if (!content) {
        setScrollProgress(0)
        return
      }

      const contentTop = content.offsetTop
      const contentHeight = content.offsetHeight
      const viewportHeight = window.innerHeight
      const scrollTop = window.scrollY
      const readableDistance = Math.max(contentHeight - viewportHeight, 1)
      const progress = ((scrollTop - contentTop) / readableDistance) * 100
      const contentBottom = content.getBoundingClientRect().bottom

      setScrollProgress(Math.min(100, Math.max(0, Math.round(progress))))
      setIsProgressDocked(contentBottom <= viewportHeight)
    }

    updateProgress()
    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)

    return () => {
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [selectedChapterId])

  useEffect(() => {
    const content = contentRef.current
    if (!content || hasRestoredScrollRef.current) return

    hasRestoredScrollRef.current = true
    const savedProgress = Number(localStorage.getItem(`reader-progress:${selectedChapterId}`) || initialReadingProgress || 0)
    if (!Number.isFinite(savedProgress) || savedProgress <= 0 || savedProgress >= 100) return

    requestAnimationFrame(() => {
      const readableDistance = Math.max(content.offsetHeight - window.innerHeight, 1)
      window.scrollTo({
        top: content.offsetTop + (readableDistance * savedProgress) / 100,
        behavior: 'auto',
      })
    })
  }, [selectedChapterId, initialReadingProgress])

  useEffect(() => {
    localStorage.setItem(`reader-progress:${selectedChapterId}`, String(scrollProgress))

    if (!novelId || !chapterNumber) return
    if (progressSaveTimerRef.current) {
      clearTimeout(progressSaveTimerRef.current)
    }

    progressSaveTimerRef.current = setTimeout(() => {
      fetch('/api/bookmarks/position', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novelId, chapterNumber, progress: scrollProgress }),
      }).catch(console.error)
    }, 1200)

    return () => {
      if (progressSaveTimerRef.current) {
        clearTimeout(progressSaveTimerRef.current)
      }
    }
  }, [selectedChapterId, scrollProgress, novelId, chapterNumber])

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Do not trigger if typing in a form input/textarea
      const target = event.target as HTMLElement
      if (['INPUT', 'TEXTAREA'].includes(target.tagName)) return

      if (event.key === 'ArrowLeft' && hasPrevChapter) {
        handlePrevChapter()
      } else if (event.key === 'ArrowRight' && hasNextChapter) {
        handleNextChapter()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasPrevChapter, hasNextChapter, handlePrevChapter, handleNextChapter])

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
        translations={translationOptions.length > 1 ? translationOptions : []}
      />

      <article
        ref={contentRef}
        className={`${themeClass} ${fontSizeClass} ${readerFontClass} ${lineHeightClass} ${paragraphSpacingClass} flex-1 px-4 py-8 md:px-8`}
      >
        <div className={`mx-auto ${contentWidthClass}`}>
          <div className="markdown-content">
            <div className="mb-4 flex justify-end">
              <ReportButton targetType="CHAPTER" chapterId={selectedChapter?.id} label="Поскаржитись на розділ" />
            </div>
            <SafeMarkdown>{selectedChapter?.content || ''}</SafeMarkdown>
          </div>
        </div>
      </article>

      {/* Chapter scroll progress */}
      <div className={`${isProgressDocked ? 'border-y' : 'fixed inset-x-0 bottom-0 z-40 border-t'} bg-background/95 px-4 py-2 backdrop-blur`}>
        <div className="container mx-auto">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Прогрес розділу
            </span>
            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="absolute left-0 top-0 h-full bg-primary transition-all"
                style={{ width: `${scrollProgress}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {scrollProgress}%
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className={`flex items-center justify-center gap-4 border-t p-4 ${isProgressDocked ? '' : 'pb-14'}`}>
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
