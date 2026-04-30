'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react'

interface Novel {
  id: string
  title: string
  slug: string
  description: string
  type: string
  status: string
  translationStatus: string
  releaseYear: number | null
  coverUrl: string | null
  genres: { genre: { name: string } }[]
  authors: { author: { name: string } }[]
  createdAt: Date | string
}

interface NovelModerationProps {
  novels: Novel[]
}

export default function NovelModerationList({ novels }: NovelModerationProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleModerate = async (id: string, action: 'APPROVE' | 'REJECT') => {
    setLoadingId(id)
    try {
      const res = await fetch(`/api/moderation/novels/${id}`, {
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

  if (novels.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Немає нвелів на перевірці
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {novels.map((novel) => (
        <div key={novel.id} className="border rounded-lg p-4">
          <div className="flex gap-4">
            {novel.coverUrl && (
              <img
                src={novel.coverUrl}
                alt={novel.title}
                className="w-20 h-28 object-cover rounded"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold">{novel.title}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                {novel.authors.map(a => a.author.name).join(', ')}
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {novel.genres.map((g) => (
                  <span key={g.genre.name} className="text-xs bg-muted px-2 py-1 rounded">
                    {g.genre.name}
                  </span>
                ))}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {novel.description}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>Тип: {novel.type}</span>
                <span>Статус: {novel.status}</span>
                <span>Переклад: {novel.translationStatus}</span>
                {novel.releaseYear && <span>Рік: {novel.releaseYear}</span>}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                >
                  <Link href={`/novel/${novel.slug}`} target="_blank">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Переглянути
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                >
                  <Link href={`/admin/novels/${novel.slug}/edit`}>
                    Редагувати
                  </Link>
                </Button>
              </div>
              <Button
                size="sm"
                onClick={() => handleModerate(novel.id, 'APPROVE')}
                disabled={loadingId === novel.id}
                className="bg-green-600 hover:bg-green-700"
              >
                {loadingId === novel.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                схвалити
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleModerate(novel.id, 'REJECT')}
                disabled={loadingId === novel.id}
              >
                {loadingId === novel.id ? (
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