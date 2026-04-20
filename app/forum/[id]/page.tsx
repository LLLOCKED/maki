import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ForumCommentSection from '@/components/forum/forum-comment-section'
import TopicVoteButtons from '@/components/forum/topic-vote-buttons'

interface TopicPageProps {
  params: { id: string }
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function getTopic(id: string) {
  return prisma.forumTopic.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, image: true },
      },
      category: {
        select: { id: true, name: true, slug: true, color: true },
      },
      novel: {
        select: { id: true, title: true, slug: true },
      },
      votes: {
        select: {
          value: true,
          userId: true,
        },
      },
      comments: {
        where: { parentId: null },
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
          replies: {
            include: {
              user: {
                select: { id: true, name: true, image: true },
              },
              replies: {
                include: {
                  user: {
                    select: { id: true, name: true, image: true },
                  },
                  replies: {
                    include: {
                      user: {
                        select: { id: true, name: true, image: true },
                      },
                      replies: {
                        include: {
                          user: {
                            select: { id: true, name: true, image: true },
                          },
                        },
                      },
                    },
                  },
                },
                orderBy: { createdAt: 'asc' },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
}

export async function generateMetadata({ params }: TopicPageProps) {
  const topic = await getTopic(params.id)
  if (!topic) return { title: 'Тема не найдена' }
  return { title: `${topic.title} — Форум` }
}

export default async function TopicPage({ params }: TopicPageProps) {
  const session = await auth()
  const topic = await getTopic(params.id)

  if (!topic) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/forum"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Вернуться к форуму
        </Link>
      </div>

      {/* Topic Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <Badge
              style={{
                backgroundColor: topic.category.color + '20',
                color: topic.category.color,
              }}
            >
              {topic.category.name}
            </Badge>
            {topic.novel && (
              <Link href={`/novel/${topic.novel.slug}`}>
                <Badge variant="secondary" className="hover:bg-secondary/80">
                  {topic.novel.title}
                </Badge>
              </Link>
            )}
            <span className="text-sm text-muted-foreground">
              {formatDate(topic.createdAt)}
            </span>
          </div>

          <h1 className="mb-4 text-2xl font-bold">{topic.title}</h1>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                {topic.user.image ? (
                  <img
                    src={topic.user.image}
                    alt={topic.user.name || ''}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-medium">
                    {topic.user.name?.[0] || '?'}
                  </span>
                )}
              </div>
              <div>
                <Link
                  href={`/user/${topic.user.id}`}
                  className="font-medium hover:underline"
                >
                  {topic.user.name || 'Пользователь'}
                </Link>
              </div>
            </div>

            <TopicVoteButtons
              topicId={topic.id}
              votes={topic.votes}
              currentUserId={session?.user?.id}
            />
          </div>

          <div className="mt-6 whitespace-pre-wrap text-muted-foreground">
            {topic.content}
          </div>
        </CardContent>
      </Card>

      {/* Comments */}
      <ForumCommentSection
        topicId={topic.id}
        comments={topic.comments}
        currentUserId={session?.user?.id}
      />
    </div>
  )
}
