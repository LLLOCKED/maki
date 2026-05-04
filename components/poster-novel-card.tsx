'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Star } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface PosterNovelCardProps {
  novel: {
    id: string
    title: string
    slug: string
    coverUrl: string | null
    authors?: string[]
    type?: string
    isExplicit?: boolean
    contentWarnings?: string[]
    averageRating?: number
  }
}

const typeLabels: Record<string, string> = {
  JAPAN: 'Японія',
  KOREA: 'Корея',
  CHINA: 'Китай',
  ENGLISH: 'Англійська',
  ORIGINAL: 'Авторський',
}

const contentWarningLabels: Record<string, string> = {
  violence: 'Насилля',
  gore: 'Кров\'яні сцени',
  sexual: 'Сексуальний контент',
  psychological: 'Психологічний тиск',
  'self-harm': 'Самогубство/самопошкодження',
}

export default function PosterNovelCard({ novel }: PosterNovelCardProps) {
  const authorDisplay = novel.authors?.slice(0, 2).join(', ')

  return (
    <Link href={`/novel/${novel.slug}`}>
      <Card className="w-[120px] sm:w-[140px] md:w-[160px] flex-shrink-0 overflow-hidden transition-shadow hover:shadow-lg">
        <div className="relative aspect-[3/4] bg-muted">
          {novel.coverUrl ? (
            <Image
              src={novel.coverUrl}
              alt={novel.title}
              fill
              sizes="(min-width: 768px) 160px, (min-width: 640px) 140px, 120px"
              loading="eager"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <BookOpen className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
            </div>
          )}
          {novel.type && (
            <div className="absolute top-1 left-1">
              <Badge variant="secondary" className="text-xs px-1 py-0">
                {typeLabels[novel.type] || novel.type}
              </Badge>
            </div>
          )}
          {novel.isExplicit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="absolute bottom-2 left-2 px-1 py-0.5 text-xs text-white bg-red-600 rounded font-bold cursor-help">
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
          {typeof novel.averageRating === 'number' && (
            <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/60 rounded px-1 py-0.5">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-[10px] font-medium text-white">
                {novel.averageRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
        <CardContent className="p-1.5 sm:p-2">
          <h3 className="line-clamp-2 overflow-hidden text-xs sm:text-sm font-medium leading-tight text-center">
            {novel.title}
          </h3>
          {authorDisplay && (
            <p className="mt-1 line-clamp-1 overflow-hidden text-center text-[9px] sm:text-[10px] text-muted-foreground">
              {authorDisplay}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
