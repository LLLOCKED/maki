'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TopicVote {
  value: number
}

interface TopicVoteButtonsProps {
  topicId: string
  votes: TopicVote[]
  currentUserId?: string
}

export default function TopicVoteButtons({ topicId, votes, currentUserId }: TopicVoteButtonsProps) {
  const router = useRouter()
  const [votesState, setVotes] = useState(votes)
  const [isVoting, setIsVoting] = useState(false)

  const score = votesState.reduce((sum, v) => sum + v.value, 0)
  const userVote = votesState.length > 0 ? votesState[votesState.length - 1].value : 0

  const handleVote = async (value: number) => {
    if (!currentUserId || isVoting) return

    setIsVoting(true)
    try {
      const newValue = userVote === value ? 0 : value

      const res = await fetch('/api/forum/topics/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId, value: newValue }),
      })

      if (res.ok) {
        if (newValue === 0) {
          setVotes([])
        } else {
          setVotes([{ value: newValue }])
        }
        router.refresh()
      }
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => handleVote(1)}
        disabled={!currentUserId || isVoting}
        className={cn(
          'flex items-center gap-1 rounded-md px-3 py-1.5 transition-colors',
          userVote === 1
            ? 'bg-orange-500/20 text-orange-500'
            : 'bg-muted text-muted-foreground hover:text-orange-500',
          !currentUserId && 'opacity-50 cursor-not-allowed'
        )}
      >
        <ThumbsUp className="h-4 w-4" />
        <span className="text-sm font-medium">{score > 0 ? `+${score}` : score}</span>
      </button>

      <button
        onClick={() => handleVote(-1)}
        disabled={!currentUserId || isVoting}
        className={cn(
          'flex items-center gap-1 rounded-md px-3 py-1.5 transition-colors',
          userVote === -1
            ? 'bg-blue-500/20 text-blue-500'
            : 'bg-muted text-muted-foreground hover:text-blue-500',
          !currentUserId && 'opacity-50 cursor-not-allowed'
        )}
      >
        <ThumbsDown className="h-4 w-4" />
      </button>
    </div>
  )
}