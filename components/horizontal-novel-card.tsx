import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, BookOpen, BookText, Star } from 'lucide-react'

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
        <div className="relative h-48 w-32 flex-shrink-0 overflow-hidden bg-muted sm:h-56 sm:w-40">
          {novel.coverUrl ? (
            <Image
              src={novel.coverUrl}
              alt={novel.title}
              fill
              sizes="(min-width: 640px) 160px, 128px"
              loading="eager"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <BookOpen className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
            </div>
          )}
          {novel.isExplicit && (
            <div className="absolute top-2 left-2">
              <span className="px-1.5 py-0.5 text-xs text-white bg-red-600 rounded font-bold">
                18+
              </span>
            </div>
          )}
          {novel.contentWarnings && novel.contentWarnings.length > 0 && (
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              {novel.contentWarnings.slice(0, 2).map((warning) => (
                <span key={warning} className="px-1.5 py-0.5 text-xs text-white bg-red-500 rounded">
                  <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-between p-4">
          <div>
            <h3 className="text-lg font-semibold leading-tight">{novel.title}</h3>
            {authorNames && (
              <p className="mt-1 text-sm text-muted-foreground">{authorNames}</p>
            )}

            <div className="mt-2 flex flex-wrap gap-1">
              {novel.genres.slice(0, 3).map(({ genre }) => (
                <Badge key={genre.slug} variant="secondary" className="text-xs">
                  {genre.name}
                </Badge>
              ))}
            </div>

            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {novel.description}
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {latestChapter && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <BookText className="h-3 w-3" />
                <span>Розд. {latestChapter.number}</span>
                <span className="truncate">{latestChapter.title}</span>
                <span>·</span>
                <span>{formatDate(latestChapter.createdAt)}</span>
              </div>
            )}

            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">
                {novel.averageRating.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
