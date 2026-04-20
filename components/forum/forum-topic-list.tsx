'use client'

import { Card } from '@/components/ui/card'
import ForumTopicCard from './forum-topic-card'

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

interface ForumTopicListProps {
  topics: Topic[]
  currentUserId?: string
}

export default function ForumTopicList({ topics, currentUserId }: ForumTopicListProps) {
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
        <ForumTopicCard key={topic.id} topic={topic} currentUserId={currentUserId} />
      ))}
    </div>
  )
}