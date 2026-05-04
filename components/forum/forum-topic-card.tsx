'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import UserPresence, { OnlineDot } from '@/components/user-presence'

interface TopicVote {
  value: number
  userId: string
}

interface Topic {
  id: string
  title: string
  content: string
  createdAt: Date
  user: {
    id: string
    name: string | null
    image: string | null
    lastSeen?: Date | string | null
  }
  category: {
    id: string
    name: string
    slug: string
    color: string
  }
  novel: {
    id: string
    title: string
    slug: string
  } | null
  votes: TopicVote[]
  _count: {
    comments: number
  }
}

interface ForumTopicCardProps {
  topic: Topic
  currentUserId?: string
  hideVotes?: boolean
  hideUserActivity?: boolean
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

function getVoteScore(votes: TopicVote[]): number {
  return votes.reduce((sum, v) => sum + v.value, 0)
}

export default function ForumTopicCard({
  topic,
  currentUserId,
  hideVotes = false,
  hideUserActivity = false,
}: ForumTopicCardProps) {
  const router = useRouter()
  const [votes, setVotes] = useState(topic.votes)
  const [isVoting, setIsVoting] = useState(false)

  const score = getVoteScore(votes)
  const userVote = currentUserId ? votes.find(v => v.userId === currentUserId)?.value || 0 : 0

  const handleVote = async (value: number) => {
    if (!currentUserId || isVoting) return

    const previousVote = votes.find(v => v.userId === currentUserId)?.value || 0
    const newValue = previousVote === value ? 0 : value

    setIsVoting(true)
    try {
      const res = await fetch('/api/forum/topics/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId: topic.id, value: newValue }),
      })

      if (res.ok) {
        // Update local state
        if (newValue === 0) {
          setVotes(votes.filter(v => v.userId !== currentUserId))
        } else if (previousVote !== 0) {
          setVotes(votes.map(v =>
            v.userId === currentUserId ? { ...v, value: newValue } : v
          ))
        } else {
          setVotes([...votes, { value: newValue, userId: currentUserId! }])
        }
        router.refresh()
      }
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <Card className="transition-colors hover:bg-muted/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {!hideVotes && (
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => handleVote(1)}
                disabled={!currentUserId || isVoting}
                className={cn(
                  'rounded p-1 transition-colors',
                  userVote === 1 ? 'text-orange-500 bg-orange-500/10' : 'text-muted-foreground hover:text-orange-500',
                  !currentUserId && 'opacity-50 cursor-not-allowed'
                )}
              >
                <ThumbsUp className="h-4 w-4" />
              </button>
              <span className={cn(
                'text-sm font-medium',
                score > 0 ? 'text-orange-500' : score < 0 ? 'text-blue-500' : 'text-muted-foreground'
              )}>
                {score}
              </span>
              <button
                onClick={() => handleVote(-1)}
                disabled={!currentUserId || isVoting}
                className={cn(
                  'rounded p-1 transition-colors',
                  userVote === -1 ? 'text-blue-500 bg-blue-500/10' : 'text-muted-foreground hover:text-blue-500',
                  !currentUserId && 'opacity-50 cursor-not-allowed'
                )}
              >
                <ThumbsDown className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Topic content */}
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2 flex-wrap">
              <Badge
                variant="secondary"
                style={{
                  backgroundColor: topic.category.color + '20',
                  color: topic.category.color,
                }}
              >
                {topic.category.name}
              </Badge>
              {topic.novel && (
                <Link href={`/novel/${topic.novel.slug}`}>
                  <Badge variant="outline" className="text-xs hover:bg-secondary">
                    {topic.novel.title}
                  </Badge>
                </Link>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDate(topic.createdAt)}
              </span>
            </div>
            <Link href={`/forum/${topic.id}`} className="block">
              <h3 className="mb-1 font-medium hover:text-primary">{topic.title}</h3>
              <p className="line-clamp-1 text-sm text-muted-foreground">
                {topic.content}
              </p>
            </Link>
            {!hideUserActivity && (
              <div className="mt-2 flex items-center gap-2">
                <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                  {topic.user.image ? (
                    <img
                      src={topic.user.image}
                      alt={topic.user.name || ''}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <span>{topic.user.name?.[0] || '?'}</span>
                  )}
                  <OnlineDot lastSeen={topic.user.lastSeen} className="absolute bottom-0 right-0 h-2.5 w-2.5 border" />
                </div>
                <span className="text-xs text-muted-foreground">
                  {topic.user.name || 'Користувач'}
                </span>
                <UserPresence lastSeen={topic.user.lastSeen} compact />
              </div>
            )}
          </div>

          {/* Comments count */}
          <div className="flex items-center gap-1 text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm">{topic._count.comments}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
