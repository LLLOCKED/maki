import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star } from 'lucide-react'

interface NovelCardProps {
  novel: {
    id: string
    title: string
    slug: string
    coverUrl: string | null
    averageRating: number
    genres: { genre: { name: string; slug: string } }[]
    authors?: { author: { id: string; name: string } }[]
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
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-4xl">📚</span>
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
