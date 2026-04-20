'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TopicVote {
  value: number
  userId: string
}

interface TopicVoteButtonsProps {
  topicId: string
  votes: TopicVote[]
  currentUserId?: string
}

export default function TopicVoteButtons({ topicId, votes, currentUserId }: TopicVoteButtonsProps) {
  const router = useRouter()
  const [localVotes, setLocalVotes] = useState<TopicVote[]>(votes)
  const [isVoting, setIsVoting] = useState(false)

  // Sync when prop changes
  useEffect(() => {
    setLocalVotes(votes)
  }, [votes])

  const score = localVotes.reduce((sum, v) => sum + v.value, 0)
  const myVote = localVotes.find(v => v.userId === currentUserId)?.value || 0

  const handleVote = async (value: number) => {
    if (!currentUserId || isVoting) return

    // Calculate new vote value: toggle if same, otherwise switch
    const previousVote = localVotes.find(v => v.userId === currentUserId)?.value || 0
    const newValue = previousVote === value ? 0 : value

    setIsVoting(true)
    try {
      const res = await fetch('/api/forum/topics/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId, value: newValue }),
      })

      if (res.ok) {
        // Optimistic update based on newValue
        let updatedVotes: TopicVote[]
        if (newValue === 0) {
          // Remove my vote
          updatedVotes = localVotes.filter(v => v.userId !== currentUserId)
        } else if (previousVote !== 0) {
          // Change my existing vote
          updatedVotes = localVotes.map(v =>
            v.userId === currentUserId ? { ...v, value: newValue } : v
          )
        } else {
          // Add new vote
          updatedVotes = [...localVotes, { value: newValue, userId: currentUserId }]
        }
        setLocalVotes(updatedVotes)
        // Refresh to get server state
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
          myVote === 1
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
          myVote === -1
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