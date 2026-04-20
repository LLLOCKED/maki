import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, BookText } from 'lucide-react'

interface HorizontalNovelCardProps {
  novel: {
    id: string
    title: string
    slug: string
    description: string
    coverUrl: string | null
    averageRating: number
    genres: { genre: { name: string; slug: string } }[]
    chapters?: { id: string; title: string; number: number; createdAt: Date; teamId: string | null }[]
    authors?: { author: { id: string; name: string } }[]
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
  const cardHref = latestChapter
    ? `/read/${novel.slug}/${latestChapter.number}?chapter=${latestChapter.id}`
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
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-3xl">📚</span>
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
