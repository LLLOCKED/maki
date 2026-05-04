'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronDown, ChevronRight, Edit2, MessageSquare, Reply, ThumbsUp, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'
import UserPresence, { OnlineDot } from '@/components/user-presence'
import CommentFormatToolbar from '@/components/comment-format-toolbar'
import CommentContent from '@/components/comment-content'
import ReportButton from '@/components/report-button'

const COMMENT_MAX_LENGTH = 2000
const COMMENT_EDIT_WINDOW_MS = 15 * 60 * 1000

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json()
    return data.error || fallback
  } catch {
    return fallback
  }
}

interface CommentUser {
  id: string
  name: string | null
  image: string | null
  lastSeen?: Date | string | null
}

interface Comment {
  id: string
  content: string
  userId: string
  createdAt: Date
  updatedAt?: Date | string
  parentId?: string | null
  user: CommentUser
  replies?: Comment[]
  score?: number
  currentUserVote?: number
}

interface ForumCommentSectionProps {
  topicId: string
  comments: Comment[]
  currentUserId?: string
  currentUserRole?: string
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
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
      if (!res.ok) {
        toast.error(await readErrorMessage(res, 'Не вдалось додати коментар'))
        return
      }

      const comment = await res.json()
      onSuccess(comment)
      setContent('')
      toast.success(parentId ? 'Відповідь додано' : 'Коментар додано')
    } catch (error) {
      console.error('Forum comment error:', error)
      toast.error('Не вдалось додати коментар')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <CommentFormatToolbar textareaRef={textareaRef} value={content} onChange={setContent} />
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={parentId ? 'Написати відповідь...' : 'Написати коментар...'}
        className="mb-2"
        maxLength={COMMENT_MAX_LENGTH}
        rows={2}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {content.length}/{COMMENT_MAX_LENGTH}
        </span>
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={isLoading || !content.trim() || content.length > COMMENT_MAX_LENGTH}>
            {isLoading ? '...' : 'Надіслати'}
          </Button>
          {onCancel && (
            <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
              Скасувати
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}

interface CommentItemProps {
  comment: Comment
  topicId: string
  currentUserId?: string
  currentUserRole?: string
  onAddReply: (parentId: string, reply: Comment) => void
  onUpdateComment: (commentId: string, content: string) => void
  onDeleteComment: (commentId: string) => void
  depth?: number
}

function CommentItem({ comment, topicId, currentUserId, currentUserRole, onAddReply, onUpdateComment, onDeleteComment, depth = 0 }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [localReplies, setLocalReplies] = useState<Comment[]>(comment.replies || [])
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [score, setScore] = useState(comment.score || 0)
  const [currentUserVote, setCurrentUserVote] = useState(comment.currentUserVote || 0)
  const [isMutating, setIsMutating] = useState(false)
  const editTextareaRef = useRef<HTMLTextAreaElement>(null)
  const isOwner = currentUserId === comment.userId
  const isModerator = ['OWNER', 'ADMIN', 'MODERATOR'].includes(currentUserRole || '')
  const canEdit = isOwner && Date.now() - new Date(comment.createdAt).getTime() <= COMMENT_EDIT_WINDOW_MS
  const isEdited = Boolean(comment.updatedAt && new Date(comment.updatedAt).getTime() - new Date(comment.createdAt).getTime() > 1000)

  const handleReplySuccess = (reply: Comment) => {
    onAddReply(comment.id, reply)
    setLocalReplies([...localReplies, reply])
    setShowReplyForm(false)
  }

  async function handleVote() {
    if (!currentUserId || isMutating) return
    setIsMutating(true)
    try {
      const nextVote = currentUserVote === 1 ? 0 : 1
      const res = await fetch(`/api/forum/comments/${comment.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: nextVote }),
      })
      if (!res.ok) {
        toast.error(await readErrorMessage(res, 'Не вдалось оновити лайк'))
        return
      }
      const data = await res.json()
      setScore(data.score)
      setCurrentUserVote(data.currentUserVote)
    } catch (error) {
      console.error('Vote forum comment error:', error)
      toast.error('Не вдалось оновити лайк')
    } finally {
      setIsMutating(false)
    }
  }

  async function handleEditSubmit() {
    if (!editContent.trim() || isMutating) return
    setIsMutating(true)
    try {
      const res = await fetch(`/api/forum/comments/${comment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      })
      if (!res.ok) {
        toast.error(await readErrorMessage(res, 'Не вдалось оновити коментар'))
        return
      }
      onUpdateComment(comment.id, editContent)
      setIsEditing(false)
      toast.success('Коментар оновлено')
    } catch (error) {
      console.error('Update forum comment error:', error)
      toast.error('Не вдалось оновити коментар')
    } finally {
      setIsMutating(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Видалити цей коментар?')) return
    setIsMutating(true)
    try {
      const res = await fetch(`/api/forum/comments/${comment.id}`, { method: 'DELETE' })
      if (!res.ok) {
        toast.error(await readErrorMessage(res, 'Не вдалось видалити коментар'))
        return
      }
      onDeleteComment(comment.id)
      toast.success('Коментар видалено')
    } catch (error) {
      console.error('Delete forum comment error:', error)
      toast.error('Не вдалось видалити коментар')
    } finally {
      setIsMutating(false)
    }
  }

  return (
    <div className={depth > 0 ? 'ml-6 border-l-2 border-muted pl-4' : ''}>
      <Card className="mb-2">
        <CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {localReplies.length > 0 && (
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  aria-label={isCollapsed ? 'Розгорнути гілку' : 'Згорнути гілку'}
                >
                  {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              )}
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-muted">
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
                <OnlineDot lastSeen={comment.user.lastSeen} className="absolute bottom-0 right-0 h-3 w-3 border-2" />
              </div>
              <div>
                <Link
                  href={`/user/${comment.user.id}`}
                  className="font-medium hover:underline"
                >
                  {comment.user.name || 'Користувач'}
                </Link>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <UserPresence lastSeen={comment.user.lastSeen} compact />
                  <span className="text-xs text-muted-foreground">
                    {formatDate(comment.createdAt)}
                  </span>
                  {isEdited && (
                    <span className="text-xs text-muted-foreground">змінено</span>
                  )}
                  {isCollapsed && localReplies.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {localReplies.length} відповід{localReplies.length === 1 ? 'ь' : 'ей'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          {isEditing ? (
            <div>
              <CommentFormatToolbar textareaRef={editTextareaRef} value={editContent} onChange={setEditContent} />
              <Textarea ref={editTextareaRef} value={editContent} onChange={(event) => setEditContent(event.target.value)} maxLength={COMMENT_MAX_LENGTH} rows={3} />
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">{editContent.length}/{COMMENT_MAX_LENGTH}</span>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleEditSubmit} disabled={isMutating || !editContent.trim()}>Зберегти</Button>
                  <Button size="sm" variant="ghost" onClick={() => {
                    setEditContent(comment.content)
                    setIsEditing(false)
                  }}>Скасувати</Button>
                </div>
              </div>
            </div>
          ) : (
            <CommentContent content={editContent} className="text-sm" />
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {currentUserId && (
              <Button variant="ghost" size="sm" onClick={handleVote} disabled={isMutating} className={`h-auto p-0 ${currentUserVote === 1 ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                <ThumbsUp className="mr-1 h-4 w-4" />
                {score}
              </Button>
            )}
            {currentUserId && depth < 4 && (
              <Button variant="ghost" size="sm" onClick={() => setShowReplyForm(!showReplyForm)} className="h-auto p-0 text-muted-foreground hover:text-foreground">
                <Reply className="mr-1 h-4 w-4" />
                Відповісти
              </Button>
            )}
            {currentUserId && !isOwner && (
              <ReportButton targetType="FORUM_COMMENT" forumCommentId={comment.id} label="Поскаржитись на коментар" />
            )}
            {(isOwner || isModerator) && !isEditing && (
              <>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditing(true)}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    title="Редагувати"
                    aria-label="Редагувати коментар"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  disabled={isMutating}
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  title="Видалити"
                  aria-label="Видалити коментар"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
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
      {!isCollapsed && localReplies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          topicId={topicId}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onUpdateComment={onUpdateComment}
          onDeleteComment={onDeleteComment}
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
  currentUserRole,
}: ForumCommentSectionProps) {
  const [comments, setComments] = useState(initialComments)
  const [showForm, setShowForm] = useState(false)
  const [sort, setSort] = useState<'oldest' | 'newest'>('oldest')

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
    setComments(sort === 'newest' ? [comment, ...comments] : [...comments, comment])
    setShowForm(false)
  }

  const updateCommentContent = (commentId: string, content: string) => {
    const updateTree = (items: Comment[]): Comment[] => items.map((item) => (
      item.id === commentId
        ? { ...item, content }
        : { ...item, replies: updateTree(item.replies || []) }
    ))
    setComments(updateTree(comments))
  }

  const removeComment = (commentId: string) => {
    const removeFromTree = (items: Comment[]): Comment[] => items
      .filter((item) => item.id !== commentId)
      .map((item) => ({ ...item, replies: removeFromTree(item.replies || []) }))
    setComments(removeFromTree(comments))
  }

  const visibleComments = [...comments].sort((a, b) => {
    const left = new Date(a.createdAt).getTime()
    const right = new Date(b.createdAt).getTime()
    return sort === 'newest' ? right - left : left - right
  })

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Коментарі ({comments.length})
        </h2>
        {currentUserId && !showForm && (
          <div className="flex items-center gap-2">
            <select value={sort} onChange={(event) => setSort(event.target.value as 'oldest' | 'newest')} className="rounded-md border bg-background px-2 py-1 text-sm">
              <option value="oldest">Старі спочатку</option>
              <option value="newest">Нові спочатку</option>
            </select>
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
              <MessageSquare className="mr-1 h-4 w-4" />
              Написати
            </Button>
          </div>
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
        {visibleComments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            topicId={topicId}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            onAddReply={handleAddReply}
            onUpdateComment={updateCommentContent}
            onDeleteComment={removeComment}
          />
        ))}
      </div>
    </div>
  )
}
