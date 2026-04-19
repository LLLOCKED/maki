'use client'

import { useState, useCallback } from 'react'
import HorizontalNovelCard from '@/components/horizontal-novel-card'
import { Button } from '@/components/ui/button'
import { BookOpen, Loader2 } from 'lucide-react'

interface NovelChapter {
  id: string
  title: string
  number: number
  createdAt: Date
  teamId: string | null
}

interface NovelGenre {
  id: string
  novelId: string
  genreId: string
  genre: {
    id: string
    name: string
    slug: string
  }
}

interface NovelAuthor {
  id: string
  novelId: string
  authorId: string
  author: {
    id: string
    name: string
  }
}

interface Novel {
  id: string
  title: string
  slug: string
  description: string
  coverUrl: string | null
  type: string
  status: string
  translationStatus: string
  releaseYear: number | null
  averageRating: number
  viewCount: number
  createdAt: Date
  chapters: NovelChapter[]
  genres: NovelGenre[]
  authors: NovelAuthor[]
  _count: {
    comments: number
  }
}

interface NovelsListProps {
  initialNovels: Novel[]
  totalCount: number
}

export default function NovelsList({ initialNovels, totalCount }: NovelsListProps) {
  const [novels, setNovels] = useState<Novel[]>(initialNovels)
  const [page, setPage] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialNovels.length < totalCount)

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      const nextPage = page + 1
      const res = await fetch(`/api/novels?page=${nextPage}&limit=8`)
      if (res.ok) {
        const data = await res.json()
        setNovels(prev => [...prev, ...data.novels])
        setPage(nextPage)
        setHasMore(data.hasMore)
      }
    } finally {
      setIsLoading(false)
    }
  }, [page, isLoading, hasMore])

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Всі новели</h2>
      </div>

      <div className="flex flex-col gap-3">
        {novels.map((novel) => (
          <HorizontalNovelCard
            key={novel.id}
            novel={{
              ...novel,
              genres: novel.genres,
            }}
          />
        ))}
      </div>

      {/* Load more button */}
      <div className="mt-4 flex justify-center py-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Завантаження...</span>
          </div>
        ) : hasMore ? (
          <Button onClick={loadMore} variant="outline">
            Завантажити ще
          </Button>
        ) : novels.length > 0 ? (
          <span className="text-sm text-muted-foreground">
            Показано {novels.length} з {totalCount}
          </span>
        ) : null}
      </div>
    </div>
  )
}