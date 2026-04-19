'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare } from 'lucide-react'

interface Topic {
  id: string
  title: string
  content: string
  createdAt: Date
  user: {
    id: string
    name: string | null
    image: string | null
  }
  category: {
    id: string
    name: string
    slug: string
    color: string
  }
  _count: {
    comments: number
  }
}

interface ForumTopicListProps {
  topics: Topic[]
}

function formatDate(date: Date): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (hours < 1) return 'щойно'
  if (hours < 24) return `${hours}год. тому`
  if (days < 7) return `${days} дн. тому`
  return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })
}

export default function ForumTopicList({ topics }: ForumTopicListProps) {
  if (topics.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Поки немає тем. Будьте першим!</p>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {topics.map((topic) => (
        <Link key={topic.id} href={`/forum/${topic.id}`}>
          <Card className="transition-colors hover:bg-muted">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: topic.category.color + '20',
                        color: topic.category.color,
                      }}
                    >
                      {topic.category.name}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(topic.createdAt)}
                    </span>
                  </div>
                  <h3 className="mb-1 font-medium">{topic.title}</h3>
                  <p className="line-clamp-1 text-sm text-muted-foreground">
                    {topic.content}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                      {topic.user.image ? (
                        <img
                          src={topic.user.image}
                          alt={topic.user.name || ''}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <span>{topic.user.name?.[0] || '?'}</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {topic.user.name || 'Користувач'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm">{topic._count.comments}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
