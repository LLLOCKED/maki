import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, BookText } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const contentWarningLabels: Record<string, string> = {
  violence: 'Насилля',
  gore: 'Кров\'яні сцени',
  sexual: 'Сексуальний контент',
  psychological: 'Психологічний тиск',
  'self-harm': 'Самогубство/самопошкодження',
}

interface HorizontalNovelCardProps {
  novel: {
    id: string
    title: string
    slug: string
    description: string
    coverUrl: string | null
    averageRating: number
    genres: { genre: { name: string; slug: string } }[]
    chapters?: { id: string; title: string; number: number; volume: number | null; createdAt: Date; teamId: string | null; team: { slug: string; name: string } | null }[]
    authors?: { author: { id: string; name: string } }[]
    contentWarnings?: string[]
    isExplicit?: boolean
  }
}

function formatDate(date: Date): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'сьогодні'
  if (days === 1) return 'вчора'
  if (days < 7) return `${days} дн. тому`
  return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })
}

function truncateToSentences(text: string, maxSentences: number = 3): string {
  if (!text) return ''
  const sentences = text.split(/(?<=[.!?])\s+/)
  if (sentences.length <= maxSentences) return text
  return sentences.slice(0, maxSentences).join(' ') + '...'
}

export default function HorizontalNovelCard({ novel }: HorizontalNovelCardProps) {
  const latestChapter = novel.chapters?.[0]
  const volStr = latestChapter?.volume ? `${latestChapter.volume}.` : ''
  const teamPath = latestChapter?.team?.slug ? `/${latestChapter.team.slug}` : ''
  const cardHref = latestChapter
    ? `/read/${novel.slug}/${volStr}${latestChapter.number}${teamPath}`
    : `/novel/${novel.slug}`

  const authorNames = novel.authors?.map((a) => a.author.name).join(', ') || ''

  return (
    <Link href={cardHref} className="block">
      <Card className="flex overflow-hidden transition-all hover:shadow-lg">
        <div className="relative aspect-[3/4] w-24 flex-shrink-0 overflow-hidden bg-muted sm:w-32 md:w-40">
          {novel.coverUrl ? (
            <Image
              src={novel.coverUrl}
              alt={novel.title}
              fill
              sizes="(min-width: 768px) 160px, (min-width: 640px) 128px, 96px"
              loading="eager"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <BookOpen className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            </div>
          )}
          {novel.isExplicit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="absolute top-2 left-2 px-1.5 py-0.5 text-xs text-white bg-red-600 rounded font-bold cursor-help">
                  18+
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">Контент 18+</p>
                {novel.contentWarnings && novel.contentWarnings.length > 0 && (
                  <>
                    <p className="font-medium">Попередження:</p>
                    {novel.contentWarnings.map((warning) => (
                      <p key={warning}>{contentWarningLabels[warning] || warning}</p>
                    ))}
                  </>
                )}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-between p-2 sm:p-3 md:p-4 min-w-0 overflow-hidden">
          <div className="min-w-0 overflow-hidden">
            <h3 className="text-sm sm:text-base font-semibold leading-tight line-clamp-2">{novel.title}</h3>
            {authorNames && (
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground line-clamp-1">{authorNames}</p>
            )}

            <div className="mt-1.5 sm:mt-2 flex flex-wrap gap-1">
              {novel.genres.slice(0, 3).map(({ genre }) => (
                <Badge key={genre.slug} variant="secondary" className="text-[10px] sm:text-xs">
                  {genre.name}
                </Badge>
              ))}
            </div>

            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-muted-foreground hidden sm:block">
              {truncateToSentences(novel.description, 3)}
            </p>
          </div>

          <div className="mt-2 sm:mt-4 flex flex-col gap-1 sm:gap-2">
            {latestChapter && (
              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground min-w-0">
                <BookText className="h-3 w-3 flex-shrink-0" />
                <span className="flex-shrink-0">Розд. {latestChapter.number}</span>
                <span className="truncate min-w-0 flex-1">{latestChapter.title}</span>
                <span className="flex-shrink-0">·</span>
                <span className="flex-shrink-0">{formatDate(latestChapter.createdAt)}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
