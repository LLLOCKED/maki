'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PosterNovelCardProps {
  novel: {
    id: string
    title: string
    slug: string
    coverUrl: string | null
    authors?: string[]
    type?: string
  }
}

const typeLabels: Record<string, string> = {
  JAPAN: 'Японія',
  KOREA: 'Корея',
  CHINA: 'Китай',
  ENGLISH: 'Англійська',
  ORIGINAL: 'Авторський',
}

export default function PosterNovelCard({ novel }: PosterNovelCardProps) {
  const authorDisplay = novel.authors?.slice(0, 2).join(', ')

  return (
    <Link href={`/novel/${novel.slug}`}>
      <Card className="w-[160px] flex-shrink-0 overflow-hidden transition-shadow hover:shadow-lg">
        <div className="relative aspect-[3/4] bg-muted">
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
          {novel.type && (
            <div className="absolute top-1 left-1">
              <Badge variant="secondary" className="text-xs px-1 py-0">
                {typeLabels[novel.type] || novel.type}
              </Badge>
            </div>
          )}
        </div>
        <CardContent className="p-2">
          <h3 className="line-clamp-1 overflow-hidden text-xs font-medium leading-tight text-center">
            {novel.title}
          </h3>
          {authorDisplay && (
            <p className="mt-1 line-clamp-1 overflow-hidden text-center text-[10px] text-muted-foreground">
              {authorDisplay}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
