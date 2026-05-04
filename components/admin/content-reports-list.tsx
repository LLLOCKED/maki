'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { toast } from 'react-toastify'
import { AlertTriangle, CheckCircle, ExternalLink, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type ReportStatus = 'OPEN' | 'REVIEWED' | 'DISMISSED'

interface ContentReport {
  id: string
  targetType: 'NOVEL' | 'CHAPTER' | 'COMMENT' | 'FORUM_COMMENT'
  reason: string
  details: string | null
  status: ReportStatus
  createdAt: string
  resolvedAt: string | null
  user: { id: string; name: string | null; email: string | null }
  resolver: { id: string; name: string | null } | null
  novel: { id: string; title: string; slug: string } | null
  chapter: {
    id: string
    title: string
    number: number
    volume: number | null
    novel: { title: string; slug: string }
    team: { slug: string; name: string } | null
  } | null
  comment: { id: string; content: string | null; novelSlug: string | null; chapterNumber: number | null } | null
  forumComment: { id: string; content: string | null; topic: { id: string; title: string | null } | null } | null
}

const statusLabels: Record<ReportStatus, string> = {
  OPEN: 'Нові',
  REVIEWED: 'Опрацьовані',
  DISMISSED: 'Відхилені',
}

function reportTargetUrl(report: ContentReport): string {
  if (report.targetType === 'NOVEL' && report.novel) {
    return `/novel/${report.novel.slug}`
  }

  if (report.targetType === 'CHAPTER' && report.chapter) {
    const volume = report.chapter.volume ? `${report.chapter.volume}.` : ''
    const team = report.chapter.team?.slug ? `/${report.chapter.team.slug}` : ''
    return `/read/${report.chapter.novel.slug}/${volume}${report.chapter.number}${team}`
  }

  if (report.targetType === 'COMMENT' && report.comment) {
    if (report.comment.chapterNumber && report.comment.novelSlug) {
      return `/read/${report.comment.novelSlug}/${report.comment.chapterNumber}`
    }
    if (report.comment.novelSlug) return `/novel/${report.comment.novelSlug}`
  }

  if (report.targetType === 'FORUM_COMMENT' && report.forumComment?.topic) {
    return `/forum/${report.forumComment.topic.id}`
  }

  return '#'
}

function reportTargetTitle(report: ContentReport): string {
  if (report.targetType === 'NOVEL' && report.novel) return report.novel.title
  if (report.targetType === 'CHAPTER' && report.chapter) {
    return `${report.chapter.novel.title}: розділ ${report.chapter.number} ${report.chapter.title}`
  }
  if (report.targetType === 'COMMENT' && report.comment) {
    return `Коментар: ${(report.comment.content || '').slice(0, 80)}`
  }
  if (report.targetType === 'FORUM_COMMENT' && report.forumComment) {
    return `Коментар форуму: ${(report.forumComment.content || '').slice(0, 80)}`
  }
  return 'Контент видалено'
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json()
    return data.error || fallback
  } catch {
    return fallback
  }
}

export default function ContentReportsList() {
  const [reports, setReports] = useState<ContentReport[]>([])
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('OPEN')
  const [isLoading, setIsLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const counts = useMemo(() => ({
    all: reports.length,
    OPEN: reports.filter(report => report.status === 'OPEN').length,
    REVIEWED: reports.filter(report => report.status === 'REVIEWED').length,
    DISMISSED: reports.filter(report => report.status === 'DISMISSED').length,
  }), [reports])

  useEffect(() => {
    fetchReports()
  }, [statusFilter])

  async function fetchReports() {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/reports?status=${statusFilter}`)
      if (!res.ok) {
        toast.error(await readErrorMessage(res, 'Не вдалось завантажити скарги'))
        return
      }
      setReports(await res.json())
    } catch (error) {
      console.error('Reports fetch error:', error)
      toast.error('Не вдалось завантажити скарги')
    } finally {
      setIsLoading(false)
    }
  }

  async function updateStatus(id: string, status: ReportStatus) {
    setUpdatingId(id)
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })

      if (!res.ok) {
        toast.error(await readErrorMessage(res, 'Не вдалось оновити скаргу'))
        return
      }

      toast.success('Скаргу оновлено')
      await fetchReports()
    } catch (error) {
      console.error('Report update error:', error)
      toast.error('Не вдалось оновити скаргу')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <AlertTriangle className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Скарги</h1>
          <p className="text-muted-foreground">Скарги на тайтли та розділи</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(['OPEN', 'REVIEWED', 'DISMISSED', 'all'] as const).map((status) => (
          <Button
            key={status}
            type="button"
            size="sm"
            variant={statusFilter === status ? 'default' : 'outline'}
            onClick={() => setStatusFilter(status)}
          >
            {status === 'all' ? 'Всі' : statusLabels[status]} ({counts[status]})
          </Button>
        ))}
      </div>

      {isLoading ? (
        <Card className="p-8 text-center text-muted-foreground">Завантаження...</Card>
      ) : reports.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">Скарг немає</Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="text-base">{reportTargetTitle(report)}</CardTitle>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant={report.status === 'OPEN' ? 'default' : 'secondary'}>
                        {statusLabels[report.status]}
                      </Badge>
                      <span>{report.targetType === 'NOVEL' ? 'Тайтл' : 'Розділ'}</span>
                      <span>{new Date(report.createdAt).toLocaleString('uk-UA')}</span>
                      <span>від {report.user.name || report.user.email || 'Користувач'}</span>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm" className="gap-2">
                    <Link href={reportTargetUrl(report)} target="_blank">
                      <ExternalLink className="h-4 w-4" />
                      Відкрити
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Причина</p>
                  <p className="text-sm text-muted-foreground">{report.reason}</p>
                </div>
                {report.details && (
                  <div>
                    <p className="text-sm font-medium">Деталі</p>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{report.details}</p>
                  </div>
                )}
                {report.resolver && report.resolvedAt && (
                  <p className="text-xs text-muted-foreground">
                    Опрацював(ла): {report.resolver.name || 'Адмін'} {new Date(report.resolvedAt).toLocaleString('uk-UA')}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={updatingId === report.id || report.status === 'REVIEWED'}
                    onClick={() => updateStatus(report.id, 'REVIEWED')}
                    className="gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Опрацьовано
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={updatingId === report.id || report.status === 'DISMISSED'}
                    onClick={() => updateStatus(report.id, 'DISMISSED')}
                    className="gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Відхилити
                  </Button>
                  {report.status !== 'OPEN' && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={updatingId === report.id}
                      onClick={() => updateStatus(report.id, 'OPEN')}
                    >
                      Повернути в нові
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
