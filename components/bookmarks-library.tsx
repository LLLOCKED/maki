'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, Clock, Search, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type BookmarkStatus = 'reading' | 'planned' | 'completed' | 'dropped'
type StatusFilter = BookmarkStatus | 'all'
type SortMode = 'updated' | 'title' | 'rating' | 'chapters'

interface BookmarkNovel {
  id: string
  title: string
  slug: string
  coverUrl: string | null
  originalName: string | null
  averageRating: number
  chaptersCount: number
}

export interface BookmarkItem {
  id: string
  novelId: string
  status: BookmarkStatus
  readingPosition: number | null
  createdAt: string
  updatedAt: string
  readHref: string | null
  novel: BookmarkNovel
}

interface BookmarksLibraryProps {
  initialBookmarks: BookmarkItem[]
}

const statusLabels: Record<BookmarkStatus, string> = {
  reading: 'Читаю',
  planned: 'В планах',
  completed: 'Прочитано',
  dropped: 'Залишено',
}

const statusColors: Record<BookmarkStatus, string> = {
  reading: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  planned: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
  completed: 'bg-green-500/10 text-green-600 border-green-500/20',
  dropped: 'bg-red-500/10 text-red-600 border-red-500/20',
}

const statusOrder: BookmarkStatus[] = ['reading', 'planned', 'completed', 'dropped']

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json()
    return data.error || fallback
  } catch {
    return fallback
  }
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('uk-UA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export default function BookmarksLibrary({ initialBookmarks }: BookmarksLibraryProps) {
  const router = useRouter()
  const [bookmarks, setBookmarks] = useState(initialBookmarks)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortMode, setSortMode] = useState<SortMode>('updated')
  const [query, setQuery] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const counts = useMemo(() => {
    return statusOrder.reduce(
      (acc, status) => {
        acc[status] = bookmarks.filter(bookmark => bookmark.status === status).length
        return acc
      },
      {} as Record<BookmarkStatus, number>
    )
  }, [bookmarks])

  const filteredBookmarks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return bookmarks
      .filter((bookmark) => statusFilter === 'all' || bookmark.status === statusFilter)
      .filter((bookmark) => {
        if (!normalizedQuery) return true
        return (
          bookmark.novel.title.toLowerCase().includes(normalizedQuery) ||
          bookmark.novel.originalName?.toLowerCase().includes(normalizedQuery)
        )
      })
      .sort((a, b) => {
        if (sortMode === 'title') return a.novel.title.localeCompare(b.novel.title, 'uk')
        if (sortMode === 'rating') return b.novel.averageRating - a.novel.averageRating
        if (sortMode === 'chapters') return b.novel.chaptersCount - a.novel.chaptersCount
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })
  }, [bookmarks, query, sortMode, statusFilter])

  async function updateStatus(bookmark: BookmarkItem, status: BookmarkStatus) {
    setUpdatingId(bookmark.id)
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          novelId: bookmark.novelId,
          status,
          readingPosition: bookmark.readingPosition,
        }),
      })

      if (!res.ok) {
        toast.error(await readErrorMessage(res, 'Не вдалось оновити статус'))
        return
      }

      setBookmarks(prev => prev.map(item => (
        item.id === bookmark.id
          ? { ...item, status, updatedAt: new Date().toISOString() }
          : item
      )))
      toast.success(`Статус оновлено: ${statusLabels[status]}`)
      router.refresh()
    } catch (error) {
      console.error('Bookmark status update error:', error)
      toast.error('Не вдалось оновити статус')
    } finally {
      setUpdatingId(null)
    }
  }

  async function removeBookmark(bookmark: BookmarkItem) {
    if (!window.confirm(`Видалити "${bookmark.novel.title}" із закладок?`)) return

    setUpdatingId(bookmark.id)
    try {
      const res = await fetch(`/api/bookmarks?novelId=${bookmark.novelId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        toast.error(await readErrorMessage(res, 'Не вдалось видалити із закладок'))
        return
      }

      setBookmarks(prev => prev.filter(item => item.id !== bookmark.id))
      toast.success('Видалено із закладок')
      router.refresh()
    } catch (error) {
      console.error('Bookmark remove error:', error)
      toast.error('Не вдалось видалити із закладок')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto border-b pb-2">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted ${
            statusFilter === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
          }`}
        >
          Всі ({bookmarks.length})
        </button>
        {statusOrder.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
            className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted ${
              statusFilter === status ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            {statusLabels[status]} ({counts[status]})
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Пошук у закладках"
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
          <SelectTrigger className="md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Всі статуси</SelectItem>
            {statusOrder.map((status) => (
              <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortMode} onValueChange={(value) => setSortMode(value as SortMode)}>
          <SelectTrigger className="md:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">Нещодавно оновлені</SelectItem>
            <SelectItem value="title">За назвою</SelectItem>
            <SelectItem value="rating">За рейтингом</SelectItem>
            <SelectItem value="chapters">За кількістю глав</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredBookmarks.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold">Нічого не знайдено</h2>
          <p className="text-muted-foreground">Спробуйте змінити пошук або фільтр</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBookmarks.map((bookmark) => {
            const isUpdating = updatingId === bookmark.id

            return (
              <Card key={bookmark.id} className="overflow-hidden">
                <CardContent className="flex gap-4 p-4">
                  <Link href={`/novel/${bookmark.novel.slug}`} className="relative h-36 w-24 flex-shrink-0 overflow-hidden rounded bg-muted">
                    {bookmark.novel.coverUrl ? (
                      <Image
                        src={bookmark.novel.coverUrl}
                        alt={bookmark.novel.title}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <BookOpen className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                      </div>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={`/novel/${bookmark.novel.slug}`} className="hover:text-primary">
                          <h3 className="line-clamp-2 font-medium">{bookmark.novel.title}</h3>
                        </Link>
                        {bookmark.novel.originalName && (
                          <p className="mt-1 line-clamp-1 text-xs italic text-muted-foreground">
                            {bookmark.novel.originalName}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => removeBookmark(bookmark)}
                        aria-label="Видалити з закладок"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge className={statusColors[bookmark.status]}>{statusLabels[bookmark.status]}</Badge>
                      {bookmark.readingPosition && (
                        <Badge variant="outline">Розділ {bookmark.readingPosition}</Badge>
                      )}
                    </div>

                    {bookmark.status === 'reading' && bookmark.readingPosition && bookmark.novel.chaptersCount > 0 && (
                      <div className="mt-3">
                        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                          <span>Прогрес</span>
                          <span>{Math.min(bookmark.readingPosition, bookmark.novel.chaptersCount)} / {bookmark.novel.chaptersCount}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-primary"
                            style={{
                              width: `${Math.min(100, Math.round((bookmark.readingPosition / bookmark.novel.chaptersCount) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <span>{bookmark.novel.chaptersCount} глав</span>
                      <span>{bookmark.novel.averageRating.toFixed(1)} рейтинг</span>
                      <span className="col-span-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(bookmark.updatedAt)}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {bookmark.readHref && (
                        <Button asChild size="sm">
                          <Link href={bookmark.readHref}>Продовжити</Link>
                        </Button>
                      )}
                      <Select
                        value={bookmark.status}
                        onValueChange={(value) => updateStatus(bookmark, value as BookmarkStatus)}
                        disabled={isUpdating}
                      >
                        <SelectTrigger className="h-9 w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOrder.map((status) => (
                            <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
