'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sun, Moon, BookOpen, ChevronLeft, ChevronRight, Type } from 'lucide-react'

type ReaderTheme = 'light' | 'dark' | 'sepia'
type FontSize = 'sm' | 'md' | 'lg' | 'xl'
type ContentWidth = 'narrow' | 'medium' | 'wide' | 'full'
type ReaderFont = 'serif' | 'sans' | 'mono'
type LineHeight = 'compact' | 'normal' | 'relaxed'
type ParagraphSpacing = 'compact' | 'normal' | 'spacious'

const contentWidthClasses: Record<ContentWidth, string> = {
  narrow: 'max-w-2xl',
  medium: 'max-w-3xl',
  wide: 'max-w-4xl',
  full: 'max-w-full',
}

const contentWidthLabels: Record<ContentWidth, string> = {
  narrow: 'Вузько',
  medium: 'Середньо',
  wide: 'Широко',
  full: 'Повна ширина',
}

const fontSizeClasses: Record<FontSize, string> = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
  xl: 'text-2xl',
}

const fontSizeLabels: Record<FontSize, string> = {
  sm: 'Дрібний',
  md: 'Середній',
  lg: 'Крупний',
  xl: 'Дуже крупний',
}

const readerFontClasses: Record<ReaderFont, string> = {
  serif: 'reader-font-serif',
  sans: 'reader-font-sans',
  mono: 'reader-font-mono',
}

const readerFontLabels: Record<ReaderFont, string> = {
  serif: 'Засічки',
  sans: 'Без засічок',
  mono: 'Моноширинний',
}

const lineHeightClasses: Record<LineHeight, string> = {
  compact: 'reader-leading-compact',
  normal: 'reader-leading-normal',
  relaxed: 'reader-leading-relaxed',
}

const lineHeightLabels: Record<LineHeight, string> = {
  compact: 'Компактно',
  normal: 'Звичайно',
  relaxed: 'Вільно',
}

const paragraphSpacingClasses: Record<ParagraphSpacing, string> = {
  compact: 'reader-spacing-compact',
  normal: 'reader-spacing-normal',
  spacious: 'reader-spacing-spacious',
}

const paragraphSpacingLabels: Record<ParagraphSpacing, string> = {
  compact: 'Компактні',
  normal: 'Звичайні',
  spacious: 'Просторі',
}

const themeClasses: Record<ReaderTheme, string> = {
  light: 'reader-light',
  dark: 'reader-dark',
  sepia: 'reader-sepia',
}

const themeLabels: Record<ReaderTheme, string> = {
  light: 'Світла',
  dark: 'Темна',
  sepia: 'Сепія',
}

const themeIcons: Record<ReaderTheme, React.ReactNode> = {
  light: <Sun className="h-4 w-4" />,
  dark: <Moon className="h-4 w-4" />,
  sepia: <BookOpen className="h-4 w-4" />,
}

interface ReaderSettingsProps {
  onThemeChange: (theme: ReaderTheme) => void
  onFontSizeChange: (size: FontSize) => void
  onContentWidthChange: (width: ContentWidth) => void
  onReaderFontChange: (font: ReaderFont) => void
  onLineHeightChange: (height: LineHeight) => void
  onParagraphSpacingChange: (spacing: ParagraphSpacing) => void
  currentTheme: ReaderTheme
  currentFontSize: FontSize
  currentContentWidth: ContentWidth
  currentReaderFont: ReaderFont
  currentLineHeight: LineHeight
  currentParagraphSpacing: ParagraphSpacing
  onPrevChapter: () => void
  onNextChapter: () => void
  hasPrevChapter: boolean
  hasNextChapter: boolean
  currentChapter: number
  totalChapters: number
}

export default function ReaderSettings({
  onThemeChange,
  onFontSizeChange,
  onContentWidthChange,
  onReaderFontChange,
  onLineHeightChange,
  onParagraphSpacingChange,
  currentTheme,
  currentFontSize,
  currentContentWidth,
  currentReaderFont,
  currentLineHeight,
  currentParagraphSpacing,
  onPrevChapter,
  onNextChapter,
  hasPrevChapter,
  hasNextChapter,
  currentChapter,
  totalChapters,
}: ReaderSettingsProps) {
  const contentWidthKeys = Object.keys(contentWidthLabels) as ContentWidth[]
  const currentIndex = contentWidthKeys.indexOf(currentContentWidth)
  return (
    <div className="flex items-center justify-between gap-4 border-b p-4">
      {/* Spacer for centering */}
      <div className="hidden md:block flex-1" />

      {/* Centered navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevChapter}
          disabled={!hasPrevChapter}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Назад
        </Button>
        <span className="text-sm text-muted-foreground">
          {currentChapter} / {totalChapters}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onNextChapter}
          disabled={!hasNextChapter}
        >
          Вперед
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      {/* Settings on the right */}
      <div className="flex items-center gap-2 flex-1 justify-end">
        {/* Font Size */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <span className="mr-1">Аа</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Розмір шрифта</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(Object.keys(fontSizeLabels) as FontSize[]).map((size) => (
              <DropdownMenuItem
                key={size}
                onClick={() => onFontSizeChange(size)}
                className={currentFontSize === size ? 'bg-accent' : ''}
              >
                {fontSizeLabels[size]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {themeIcons[currentTheme]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Тема читалки</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(Object.keys(themeLabels) as ReaderTheme[]).map((theme) => (
              <DropdownMenuItem
                key={theme}
                onClick={() => onThemeChange(theme)}
                className={currentTheme === theme ? 'bg-accent' : ''}
              >
                <span className="mr-2">{themeIcons[theme]}</span>
                {themeLabels[theme]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Typography */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Type className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Шрифт</DropdownMenuLabel>
            {(Object.keys(readerFontLabels) as ReaderFont[]).map((font) => (
              <DropdownMenuItem
                key={font}
                onClick={() => onReaderFontChange(font)}
                className={currentReaderFont === font ? 'bg-accent' : ''}
              >
                {readerFontLabels[font]}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Міжряддя</DropdownMenuLabel>
            {(Object.keys(lineHeightLabels) as LineHeight[]).map((height) => (
              <DropdownMenuItem
                key={height}
                onClick={() => onLineHeightChange(height)}
                className={currentLineHeight === height ? 'bg-accent' : ''}
              >
                {lineHeightLabels[height]}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Абзаци</DropdownMenuLabel>
            {(Object.keys(paragraphSpacingLabels) as ParagraphSpacing[]).map((spacing) => (
              <DropdownMenuItem
                key={spacing}
                onClick={() => onParagraphSpacingChange(spacing)}
                className={currentParagraphSpacing === spacing ? 'bg-accent' : ''}
              >
                {paragraphSpacingLabels[spacing]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Content Width Slider */}
        <div className="hidden items-center gap-2 md:flex">
          <span className="text-xs text-muted-foreground">Ш</span>
          <input
            type="range"
            min={0}
            max={3}
            value={currentIndex}
            onChange={(e) => onContentWidthChange(contentWidthKeys[Number(e.target.value)])}
            className="w-20 accent-primary"
          />
          <span className="text-xs text-muted-foreground">Ш</span>
        </div>
      </div>
    </div>
  )
}

export function useReaderSettings() {
  const [theme, setTheme] = useState<ReaderTheme>('light')
  const [fontSize, setFontSize] = useState<FontSize>('md')
  const [contentWidth, setContentWidth] = useState<ContentWidth>('medium')
  const [readerFont, setReaderFont] = useState<ReaderFont>('serif')
  const [lineHeight, setLineHeight] = useState<LineHeight>('relaxed')
  const [paragraphSpacing, setParagraphSpacing] = useState<ParagraphSpacing>('normal')

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('reader-theme') as ReaderTheme | null
      const savedFontSize = localStorage.getItem('reader-font-size') as FontSize | null
      const savedWidth = localStorage.getItem('reader-content-width') as ContentWidth | null
      const savedReaderFont = localStorage.getItem('reader-font') as ReaderFont | null
      const savedLineHeight = localStorage.getItem('reader-line-height') as LineHeight | null
      const savedParagraphSpacing = localStorage.getItem('reader-paragraph-spacing') as ParagraphSpacing | null
      if (savedTheme && themeClasses[savedTheme]) setTheme(savedTheme)
      if (savedFontSize && fontSizeClasses[savedFontSize]) setFontSize(savedFontSize)
      if (savedWidth && contentWidthClasses[savedWidth]) setContentWidth(savedWidth)
      if (savedReaderFont && readerFontClasses[savedReaderFont]) setReaderFont(savedReaderFont)
      if (savedLineHeight && lineHeightClasses[savedLineHeight]) setLineHeight(savedLineHeight)
      if (savedParagraphSpacing && paragraphSpacingClasses[savedParagraphSpacing]) setParagraphSpacing(savedParagraphSpacing)
    }
  }, [])

  // Persist to localStorage on change
  const handleSetTheme = (newTheme: ReaderTheme) => {
    setTheme(newTheme)
    localStorage.setItem('reader-theme', newTheme)
  }

  const handleSetFontSize = (newSize: FontSize) => {
    setFontSize(newSize)
    localStorage.setItem('reader-font-size', newSize)
  }

  const handleSetContentWidth = (newWidth: ContentWidth) => {
    setContentWidth(newWidth)
    localStorage.setItem('reader-content-width', newWidth)
  }

  const handleSetReaderFont = (newFont: ReaderFont) => {
    setReaderFont(newFont)
    localStorage.setItem('reader-font', newFont)
  }

  const handleSetLineHeight = (newHeight: LineHeight) => {
    setLineHeight(newHeight)
    localStorage.setItem('reader-line-height', newHeight)
  }

  const handleSetParagraphSpacing = (newSpacing: ParagraphSpacing) => {
    setParagraphSpacing(newSpacing)
    localStorage.setItem('reader-paragraph-spacing', newSpacing)
  }

  const themeClass = themeClasses[theme]
  const fontSizeClass = fontSizeClasses[fontSize]
  const contentWidthClass = contentWidthClasses[contentWidth]
  const readerFontClass = readerFontClasses[readerFont]
  const lineHeightClass = lineHeightClasses[lineHeight]
  const paragraphSpacingClass = paragraphSpacingClasses[paragraphSpacing]

  return {
    theme,
    fontSize,
    contentWidth,
    readerFont,
    lineHeight,
    paragraphSpacing,
    themeClass,
    fontSizeClass,
    contentWidthClass,
    readerFontClass,
    lineHeightClass,
    paragraphSpacingClass,
    setTheme: handleSetTheme,
    setFontSize: handleSetFontSize,
    setContentWidth: handleSetContentWidth,
    setReaderFont: handleSetReaderFont,
    setLineHeight: handleSetLineHeight,
    setParagraphSpacing: handleSetParagraphSpacing,
  }
}

export type { ReaderTheme, FontSize, ContentWidth, ReaderFont, LineHeight, ParagraphSpacing }
export { fontSizeClasses, fontSizeLabels, themeClasses, themeLabels, themeIcons, contentWidthClasses, contentWidthLabels, readerFontClasses, readerFontLabels, lineHeightClasses, lineHeightLabels, paragraphSpacingClasses, paragraphSpacingLabels }
