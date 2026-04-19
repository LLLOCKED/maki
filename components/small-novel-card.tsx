import Link from 'next/link'
import Image from 'next/image'
import { Eye, MessageCircle } from 'lucide-react'

interface SmallNovelCardProps {
  novel: {
    id: string
    title: string
    slug: string
    coverUrl: string | null
    viewCount?: number
    _count?: {
      comments: number
    }
  }
  variant?: 'rating' | 'discussed'
}

export default function SmallNovelCard({ novel, variant = 'rating' }: SmallNovelCardProps) {
  return (
    <Link href={`/novel/${novel.slug}`}>
      <div className="flex items-center gap-3 p-2 transition-all hover:bg-muted/50 rounded-lg">
        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-muted">
          {novel.coverUrl ? (
            <Image
              src={novel.coverUrl}
              alt={novel.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-lg">📚</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="line-clamp-2 text-sm font-medium leading-tight">{novel.title}</h4>
          {variant === 'rating' && typeof novel.viewCount === 'number' && (
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Eye className="h-3 w-3" />
              <span>{novel.viewCount}</span>
            </div>
          )}
          {variant === 'discussed' && typeof novel._count?.comments === 'number' && (
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <MessageCircle className="h-3 w-3" />
              <span>{novel._count.comments}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
