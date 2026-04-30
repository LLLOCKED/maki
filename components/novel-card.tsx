import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, BookOpen, Star } from 'lucide-react'

interface NovelCardProps {
  novel: {
    id: string
    title: string
    slug: string
    coverUrl: string | null
    averageRating: number
    genres: { genre: { name: string; slug: string } }[]
    authors?: { author: { id: string; name: string } }[]
    contentWarnings?: string[]
    isExplicit?: boolean
  }
}

export default function NovelCard({ novel }: NovelCardProps) {
  const authorNames = novel.authors?.map((a) => a.author.name).join(', ') || ''

  return (
    <Link href={`/novel/${novel.slug}`}>
      <Card className="h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          {novel.coverUrl ? (
            <Image
              src={novel.coverUrl}
              alt={novel.title}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              loading="eager"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <BookOpen className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
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
          {novel.isExplicit && (
            <div className="absolute top-2 left-2">
              <span className="px-1.5 py-0.5 text-xs text-white bg-red-600 rounded font-bold">
                18+
              </span>
            </div>
          )}
        </div>

        <CardHeader className="p-4 pb-2">
          <h3 className="line-clamp-2 text-lg font-semibold leading-tight">
            {novel.title}
          </h3>
          {authorNames && (
            <p className="text-sm text-muted-foreground">{authorNames}</p>
          )}
        </CardHeader>

        <CardContent className="p-4 pt-0">
          <div className="flex flex-wrap gap-1">
            {novel.genres.slice(0, 3).map(({ genre }) => (
              <Badge key={genre.slug} variant="secondary" className="text-xs">
                {genre.name}
              </Badge>
            ))}
          </div>
        </CardContent>

        <CardFooter className="flex items-center gap-1 p-4 pt-0">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium">
            {novel.averageRating.toFixed(1)}
          </span>
        </CardFooter>
      </Card>
    </Link>
  )
}
