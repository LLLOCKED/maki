'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { MessageSquare, Bug, Users, Lightbulb, Coffee } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ForumTopicList from './forum-topic-list'
import { safeFetchJson } from '@/lib/fetch-json'

const categoryIcons: Record<string, React.ReactNode> = {
  bugs: <Bug className="h-5 w-5" />,
  discussion: <MessageSquare className="h-5 w-5" />,
  'team-search': <Users className="h-5 w-5" />,
  suggestions: <Lightbulb className="h-5 w-5" />,
  offtopic: <Coffee className="h-5 w-5" />,
}

interface Category {
  id: string
  name: string
  slug: string
  color: string
  description: string | null
  _count: {
    topics: number
  }
}

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

interface ForumPageContentProps {
  currentUserId?: string
}

function ForumContent({ currentUserId }: ForumPageContentProps) {
  const searchParams = useSearchParams()
  const categorySlug = searchParams.get('category')

  const [categories, setCategories] = useState<Category[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    Promise.all([
      safeFetchJson<Category[]>('/api/forum/categories'),
      safeFetchJson<Topic[]>(categorySlug
        ? `/api/forum/topics?category=${categorySlug}`
        : '/api/forum/topics'
      )
    ]).then(([categoriesData, topicsData]) => {
      setCategories(categoriesData)
      setTopics(topicsData)
    }).catch((error) => {
      console.error(error)
      setCategories([])
      setTopics([])
    })
      .finally(() => setIsLoading(false))
  }, [categorySlug])

  const currentCategory = categories.find(c => c.slug === categorySlug)
  const totalTopicsCount = categories.reduce((acc, cat) => acc + cat._count.topics, 0)

  return (
    <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
      {/* Categories Sidebar */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <MessageSquare className="h-5 w-5" />
          Категорії
        </h2>
        <div className="flex flex-col gap-2">
          <Link href="/forum">
            <Card className={`transition-colors hover:bg-muted ${!categorySlug ? 'bg-muted' : ''}`}>
              <CardContent className="flex items-center justify-between p-3">
                <span className="font-medium">Всі теми</span>
                <Badge variant="secondary">{totalTopicsCount}</Badge>
              </CardContent>
            </Card>
          </Link>
          {categories.map((category) => (
            <Link key={category.id} href={`/forum?category=${category.slug}`}>
              <Card className={`transition-colors hover:bg-muted ${categorySlug === category.slug ? 'bg-muted' : ''}`}>
                <CardContent className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded p-1"
                      style={{ backgroundColor: category.color + '20', color: category.color }}
                    >
                      {categoryIcons[category.slug] || <MessageSquare className="h-5 w-5" />}
                    </span>
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <Badge variant="secondary">{category._count.topics}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Topics List */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          {currentCategory ? currentCategory.name : 'Останні теми'}
        </h2>
        {isLoading ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Завантаження...</p>
          </Card>
        ) : (
          <ForumTopicList topics={topics} currentUserId={currentUserId} />
        )}
      </div>
    </div>
  )
}

export default function ForumPageContent({ currentUserId }: ForumPageContentProps) {
  return (
    <Suspense fallback={<div className="text-muted-foreground">Завантаження...</div>}>
      <ForumContent currentUserId={currentUserId} />
    </Suspense>
  )
}
