import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ForumCommentSection from '@/components/forum/forum-comment-section'
import TopicVoteButtons from '@/components/forum/topic-vote-buttons'
import UserPresence, { OnlineDot } from '@/components/user-presence'

interface TopicPageProps {
  params: Promise<{ id: string }>
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type ForumCommentTree = {
  id: string
  replies?: ForumCommentTree[]
  score?: number
  currentUserVote?: number
}

function collectCommentIds(comments: ForumCommentTree[]): string[] {
  return comments.flatMap((comment) => [
    comment.id,
    ...collectCommentIds(comment.replies || []),
  ])
}

function attachVoteMeta<T extends ForumCommentTree>(
  comments: T[],
  scores: Map<string, number>,
  userVotes: Map<string, number>
): T[] {
  return comments.map((comment) => ({
    ...comment,
    score: scores.get(comment.id) || 0,
    currentUserVote: userVotes.get(comment.id) || 0,
    replies: attachVoteMeta(comment.replies || [], scores, userVotes),
  }))
}

async function getTopic(id: string) {
  return prisma.forumTopic.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, image: true, lastSeen: true },
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
            select: { id: true, name: true, image: true, lastSeen: true },
          },
          replies: {
            include: {
              user: {
                select: { id: true, name: true, image: true, lastSeen: true },
              },
              replies: {
                include: {
                  user: {
                    select: { id: true, name: true, image: true, lastSeen: true },
                  },
                  replies: {
                    include: {
                      user: {
                        select: { id: true, name: true, image: true, lastSeen: true },
                      },
                      replies: {
                        include: {
                          user: {
                            select: { id: true, name: true, image: true, lastSeen: true },
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
  const { id } = await params
  const topic = await getTopic(id)
  if (!topic) return { title: 'Тему не знайдено' }
  return {
    title: `${topic.title} — Форум`,
    description: topic.content.slice(0, 160),
    alternates: { canonical: `/forum/${id}` },
    openGraph: {
      type: 'article',
      title: `${topic.title} — Форум honni`,
      description: topic.content.slice(0, 160),
      url: `/forum/${id}`,
    },
  }
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { id } = await params
  const session = await auth()
  const topic = await getTopic(id)

  if (!topic) {
    notFound()
  }

  const commentIds = collectCommentIds(topic.comments)
  const scoreRows = commentIds.length > 0
    ? await prisma.$queryRaw<{ commentId: string; score: bigint }[]>`
        SELECT "commentId", COALESCE(SUM("value"), 0)::bigint as score
        FROM "ForumCommentVote"
        WHERE "commentId" = ANY(${commentIds})
        GROUP BY "commentId"
      `
    : []
  const voteRows = session?.user?.id && commentIds.length > 0
    ? await prisma.$queryRaw<{ commentId: string; value: number }[]>`
        SELECT "commentId", "value"
        FROM "ForumCommentVote"
        WHERE "userId" = ${session.user.id} AND "commentId" = ANY(${commentIds})
      `
    : []
  const commentsWithVotes = attachVoteMeta(
    topic.comments,
    new Map(scoreRows.map((row) => [row.commentId, Number(row.score)])),
    new Map(voteRows.map((row) => [row.commentId, row.value]))
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/forum"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Повернутися до форуму
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
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-muted">
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
                <OnlineDot lastSeen={topic.user.lastSeen} className="absolute bottom-0 right-0 h-3.5 w-3.5 border-2" />
              </div>
              <div>
                <Link
                  href={`/user/${topic.user.id}`}
                  className="font-medium hover:underline"
                >
                  {topic.user.name || 'Користувач'}
                </Link>
                <UserPresence lastSeen={topic.user.lastSeen} />
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
        comments={commentsWithVotes}
        currentUserId={session?.user?.id}
        currentUserRole={session?.user?.role}
      />
    </div>
  )
}
