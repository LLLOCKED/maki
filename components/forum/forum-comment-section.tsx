'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { MessageSquare, Reply } from 'lucide-react'

interface CommentUser {
  id: string
  name: string | null
  image: string | null
}

interface Comment {
  id: string
  content: string
  createdAt: Date
  parentId?: string | null
  user: CommentUser
  replies?: Comment[]
}

interface ForumCommentSectionProps {
  topicId: string
  comments: Comment[]
  currentUserId?: string
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

interface CommentFormProps {
  topicId: string
  parentId?: string
  onCancel?: () => void
  onSuccess: (comment: Comment) => void
}

function CommentForm({ topicId, parentId, onCancel, onSuccess }: CommentFormProps) {
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/forum/topics/${topicId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parentId }),
      })
      if (res.ok) {
        const comment = await res.json()
        onSuccess(comment)
        setContent('')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={parentId ? 'Написати відповідь...' : 'Написати коментар...'}
        className="mb-2"
        rows={2}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isLoading || !content.trim()}>
          {isLoading ? '...' : 'Надіслати'}
        </Button>
        {onCancel && (
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            Скасувати
          </Button>
        )}
      </div>
    </form>
  )
}

interface CommentItemProps {
  comment: Comment
  topicId: string
  currentUserId?: string
  onAddReply: (parentId: string, reply: Comment) => void
  depth?: number
}

function CommentItem({ comment, topicId, currentUserId, onAddReply, depth = 0 }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [localReplies, setLocalReplies] = useState<Comment[]>(comment.replies || [])

  const handleReplySuccess = (reply: Comment) => {
    onAddReply(comment.id, reply)
    setLocalReplies([...localReplies, reply])
    setShowReplyForm(false)
  }

  return (
    <div className={depth > 0 ? 'ml-6 border-l-2 border-muted pl-4' : ''}>
      <Card className="mb-2">
        <CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                {comment.user.image ? (
                  <img
                    src={comment.user.image}
                    alt={comment.user.name || ''}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium">
                    {comment.user.name?.[0] || '?'}
                  </span>
                )}
              </div>
              <div>
                <Link
                  href={`/user/${comment.user.id}`}
                  className="font-medium hover:underline"
                >
                  {comment.user.name || 'Користувач'}
                </Link>
                <span className="ml-2 text-xs text-muted-foreground">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
            </div>
            {currentUserId && depth < 4 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
              >
                <Reply className="mr-1 h-4 w-4" />
                Відповісти
              </Button>
            )}
          </div>
          <div className="whitespace-pre-wrap text-sm">
            {comment.content}
          </div>
          {showReplyForm && (
            <CommentForm
              topicId={topicId}
              parentId={comment.id}
              onCancel={() => setShowReplyForm(false)}
              onSuccess={handleReplySuccess}
            />
          )}
        </CardContent>
      </Card>
      {localReplies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          topicId={topicId}
          currentUserId={currentUserId}
          onAddReply={(parentId, newReply) => {
            const updateReplies = (replies: Comment[]): Comment[] =>
              replies.map((r) =>
                r.id === parentId
                  ? { ...r, replies: [...(r.replies || []), newReply] }
                  : { ...r, replies: updateReplies(r.replies || []) }
              )
            setLocalReplies(updateReplies)
          }}
          depth={depth + 1}
        />
      ))}
    </div>
  )
}

export default function ForumCommentSection({
  topicId,
  comments: initialComments,
  currentUserId,
}: ForumCommentSectionProps) {
  const [comments, setComments] = useState(initialComments)
  const [showForm, setShowForm] = useState(false)

  const handleAddReply = (parentId: string, reply: Comment) => {
    const addReplyToComment = (commentList: Comment[]): Comment[] => {
      return commentList.map((comment) => {
        if (comment.id === parentId) {
          return { ...comment, replies: [...(comment.replies || []), reply] }
        }
        if (comment.replies && comment.replies.length > 0) {
          return { ...comment, replies: addReplyToComment(comment.replies) }
        }
        return comment
      })
    }
    setComments(addReplyToComment(comments))
  }

  const handleNewComment = (comment: Comment) => {
    setComments([...comments, comment])
    setShowForm(false)
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Коментарі ({comments.length})
        </h2>
        {currentUserId && !showForm && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            <MessageSquare className="mr-1 h-4 w-4" />
            Написати
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <CommentForm
              topicId={topicId}
              onCancel={() => setShowForm(false)}
              onSuccess={handleNewComment}
            />
          </CardContent>
        </Card>
      )}

      {!currentUserId && (
        <Card className="mb-6 p-4 text-center">
          <p className="text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline">
              Увійдіть
            </Link>
            {' '}щоб залишити коментар
          </p>
        </Card>
      )}

      <div className="flex flex-col gap-2">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            topicId={topicId}
            currentUserId={currentUserId}
            onAddReply={handleAddReply}
          />
        ))}
      </div>
    </div>
  )
}
