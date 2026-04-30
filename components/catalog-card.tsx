'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, BookOpen, Star } from 'lucide-react'

interface CatalogCardProps {
  novel: {
    id: string
    title: string
    slug: string
    description: string
    coverUrl: string | null
    averageRating: number
    genres: { genre: { name: string; slug: string } }[]
    authors?: { author: { id: string; name: string } }[]
    contentWarnings?: string[]
    isExplicit?: boolean
  }
}

function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export default function CatalogCard({ novel }: CatalogCardProps) {
  const authorNames = novel.authors?.map((a) => a.author.name).join(', ') || ''

  return (
    <Link href={`/novel/${novel.slug}`}>
      <Card className="h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
        <div className="relative w-full aspect-[3/4] bg-muted">
          {novel.coverUrl ? (
            <Image
              src={novel.coverUrl}
              alt={novel.title}
              fill
              sizes="(min-width: 1024px) 240px, (min-width: 768px) 180px, 100vw"
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

        <CardContent className="flex flex-col gap-1 p-2">
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight">
            {novel.title}
          </h3>

          {authorNames && (
            <p className="text-xs text-muted-foreground">{truncate(authorNames, 30)}</p>
          )}

          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium">{novel.averageRating.toFixed(1)}</span>
          </div>

          <p className="line-clamp-2 text-xs text-muted-foreground">
            {truncate(novel.description, 70)}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
