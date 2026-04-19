'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { MessageCircle, Send, Reply } from 'lucide-react'

interface CommentUser {
  id: string
  name: string | null
  image: string | null
}

interface Comment {
  id: string
  content: string
  userId: string
  parentId?: string | null
  createdAt: Date
  user: CommentUser
  replies?: Comment[]
}

interface CommentSectionProps {
  novelId?: string
  chapterId?: string
}

function formatDate(date: Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface CommentFormProps {
  novelId?: string
  chapterId?: string
  parentId?: string
  onCancel?: () => void
  onSuccess: (comment: Comment) => void
}

function CommentForm({ novelId, chapterId, parentId, onCancel, onSuccess }: CommentFormProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          novelId: novelId || null,
          chapterId: chapterId || null,
          parentId,
        }),
      })

      if (res.ok) {
        const comment = await res.json()
        onSuccess(comment)
        setContent('')
      }
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setIsSubmitting(false)
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
        <Button type="submit" size="sm" disabled={!content.trim() || isSubmitting}>
          {isSubmitting ? '...' : 'Надіслати'}
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
  novelId?: string
  chapterId?: string
  currentUserId?: string
  onAddReply: (parentId: string, reply: Comment) => void
  depth?: number
}

function CommentItem({ comment, novelId, chapterId, currentUserId, onAddReply, depth = 0 }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [localReplies, setLocalReplies] = useState<Comment[]>(comment.replies || [])

  const handleReplySuccess = (reply: Comment) => {
    onAddReply(comment.id, reply)
    setLocalReplies([...localReplies, reply])
    setShowReplyForm(false)
  }

  return (
    <div className={depth > 0 ? 'ml-6 border-l-2 border-muted pl-4' : ''}>
      <Card className="mb-2 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
            {comment.user.image ? (
              <img
                src={comment.user.image}
                alt={comment.user.name || ''}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              comment.user.name?.[0] || 'U'
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Link href={`/user/${comment.user.id}`} className="font-medium hover:underline">
                {comment.user.name || 'Анонім'}
              </Link>
              <span className="text-xs text-muted-foreground">
                {formatDate(comment.createdAt)}
              </span>
            </div>
            <p className="mt-1 text-sm">{comment.content}</p>
            <div className="mt-2">
              {currentUserId && depth < 4 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="h-auto p-0 text-muted-foreground hover:text-foreground"
                >
                  <Reply className="mr-1 h-4 w-4" />
                  Відповісти
                </Button>
              )}
            </div>
            {showReplyForm && (
              <CommentForm
                novelId={novelId}
                chapterId={chapterId}
                parentId={comment.id}
                onCancel={() => setShowReplyForm(false)}
                onSuccess={handleReplySuccess}
              />
            )}
          </div>
        </div>
      </Card>
      {localReplies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          novelId={novelId}
          chapterId={chapterId}
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

export default function CommentSection({ novelId, chapterId }: CommentSectionProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [novelId, chapterId])

  async function fetchComments() {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (novelId) params.set('novelId', novelId)
      if (chapterId) params.set('chapterId', chapterId)

      const res = await fetch(`/api/comments?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setComments(data)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setIsLoading(false)
    }
  }

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
    setComments([comment, ...comments])
    setShowForm(false)
  }

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xl font-semibold">
          <MessageCircle className="h-5 w-5" />
          Коментарі ({comments.length})
        </h3>
        {session && !showForm && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            Написати
          </Button>
        )}
      </div>

      {/* Comment Form */}
      {session && showForm && (
        <Card className="mb-6 p-4">
          <CommentForm
            novelId={novelId}
            chapterId={chapterId}
            onCancel={() => setShowForm(false)}
            onSuccess={handleNewComment}
          />
        </Card>
      )}

      {!session && (
        <Card className="mb-6 p-4 text-center text-muted-foreground">
          <p>
            <Link href="/login" className="text-primary hover:underline">
              Увійдіть
            </Link>
            {' '}, щоб залишити коментар
          </p>
        </Card>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="text-center text-muted-foreground">Завантаження...</div>
      ) : comments.length === 0 ? (
        <div className="text-center text-muted-foreground">
          Поки немає коментарів. Будьте першим!
        </div>
      ) : (
        <div className="space-y-2">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              novelId={novelId}
              chapterId={chapterId}
              currentUserId={session?.user?.id}
              onAddReply={handleAddReply}
            />
          ))}
        </div>
      )}
    </div>
  )
}
