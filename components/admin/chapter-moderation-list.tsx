'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react'

interface Chapter {
  id: string
  title: string
  number: number
  content: string
  novel: {
    id: string
    title: string
    slug: string
  } | null
  team: {
    id: string
    name: string
  } | null
  createdAt: Date | string
}

interface ChapterModerationProps {
  chapters: Chapter[]
}

export default function ChapterModerationList({ chapters }: ChapterModerationProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleModerate = async (id: string, action: 'APPROVE' | 'REJECT') => {
    setLoadingId(id)
    try {
      const res = await fetch(`/api/moderation/chapters/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (res.ok) {
        router.refresh()
      }
    } finally {
      setLoadingId(null)
    }
  }

  if (chapters.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Немає розділів на перевірці
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {chapters.map((chapter) => (
        <div key={chapter.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">
                {chapter.title} (#{chapter.number})
              </h3>
              {chapter.novel && (
                <p className="text-sm text-muted-foreground">
                  Новела: {chapter.novel.title}
                </p>
              )}
              {chapter.team && (
                <p className="text-xs text-muted-foreground">
                  Команда: {chapter.team.name}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                {chapter.content.substring(0, 300)}...
              </p>
            </div>
            <div className="flex flex-col gap-2 ml-4">
              <div className="flex gap-2">
                {chapter.novel && (
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                  >
                    <Link href={`/novel/${chapter.novel.slug}`} target="_blank">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Переглянути
                    </Link>
                  </Button>
                )}
                {chapter.novel && (
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                  >
                    <Link href={`/read/${chapter.novel.slug}/${chapter.number}`} target="_blank">
                      Читати
                    </Link>
                  </Button>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => handleModerate(chapter.id, 'APPROVE')}
                disabled={loadingId === chapter.id}
                className="bg-green-600 hover:bg-green-700"
              >
                {loadingId === chapter.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                схвалити
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleModerate(chapter.id, 'REJECT')}
                disabled={loadingId === chapter.id}
              >
                {loadingId === chapter.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                відхилити
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}