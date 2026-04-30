'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Filter } from 'lucide-react'

const ACTION_LABELS: Record<string, { label: string; variant: 'default' | 'destructive' | 'outline' }> = {
  WARN_USER: { label: 'Попередження', variant: 'default' },
  BAN_USER: { label: 'Бан', variant: 'destructive' },
  UNBAN_USER: { label: 'Розбан', variant: 'outline' },
  APPROVE_NOVEL: { label: 'Схвалено тайтл', variant: 'outline' },
  REJECT_NOVEL: { label: 'Відхилено тайтл', variant: 'destructive' },
  APPROVE_CHAPTER: { label: 'Схвалено розділ', variant: 'outline' },
  REJECT_CHAPTER: { label: 'Відхилено розділ', variant: 'destructive' },
  RESET_MODERATION: { label: 'Повернено на модерацію', variant: 'default' },
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState('')
  const [page, setPage] = useState(0)
  const limit = 20

  useEffect(() => {
    fetchLogs()
  }, [page, actionFilter])

  async function fetchLogs() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(page * limit),
      })
      if (actionFilter) params.set('action', actionFilter)

      const res = await fetch(`/api/admin/log?${params}`)
      const data = await res.json()
      setLogs(data.logs || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Журнал активності</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Фільтр по дії..."
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value)
              setPage(0)
            }}
            className="w-48"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Час</TableHead>
              <TableHead>Адмін</TableHead>
              <TableHead>Дія</TableHead>
              <TableHead>Ціль</TableHead>
              <TableHead>Деталі</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Завантаження...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Немає записів
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const actionInfo = ACTION_LABELS[log.action] || { label: log.action, variant: 'default' as const }
                return (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(log.createdAt), 'dd MMM yyyy HH:mm', { locale: uk })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {log.user?.image && (
                          <img
                            src={log.user.image}
                            alt=""
                            className="h-6 w-6 rounded-full object-cover"
                          />
                        )}
                        <span className="text-sm">{log.user?.name || 'Невідомо'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={actionInfo.variant}>{actionInfo.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.targetType && log.targetId ? (
                        <span>{log.targetType}: {log.targetId.slice(0, 8)}...</span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {log.details ? JSON.parse(log.details).reason || log.details : '-'}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {total > limit && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Попередня
          </Button>
          <span className="text-sm text-muted-foreground">
            Сторінка {page + 1} з {Math.ceil(total / limit)}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={(page + 1) * limit >= total}
          >
            Наступна
          </Button>
        </div>
      )}
    </div>
  )
}