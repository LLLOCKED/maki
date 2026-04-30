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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, Star, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { safeFetchJson } from '@/lib/fetch-json'

interface NovelStats {
  totalNovels: number
  pendingNovels: number
  rejectedNovels: number
  totalViews: number
  avgRating: number
  noCoverCount: number
  lowRatingCount: number
}

export default function SEOPage() {
  const [stats, setStats] = useState<NovelStats>({
    totalNovels: 0,
    pendingNovels: 0,
    rejectedNovels: 0,
    totalViews: 0,
    avgRating: 0,
    noCoverCount: 0,
    lowRatingCount: 0,
  })
  const [novels, setNovels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pending' | 'no-cover' | 'low-rating' | 'all'>('pending')

  useEffect(() => {
    fetchStats()
    fetchNovels()
  }, [tab])

  async function fetchStats() {
    try {
      const data = await safeFetchJson<NovelStats>('/api/admin/seo/stats')
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  async function fetchNovels() {
    setLoading(true)
    try {
      const data = await safeFetchJson<{ novels?: any[] }>(`/api/admin/seo/novels?tab=${tab}`)
      setNovels(data.novels || [])
    } catch (error) {
      console.error('Error fetching novels:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold">SEO Дашборд</h1>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Всього переглядів</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-yellow-500/10 p-3">
                <AlertCircle className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingNovels}</p>
                <p className="text-sm text-muted-foreground">На модерації</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-destructive/10 p-3">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.noCoverCount}</p>
                <p className="text-sm text-muted-foreground">Без постеру</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-yellow-500/10 p-3">
                <Star className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.lowRatingCount}</p>
                <p className="text-sm text-muted-foreground">Низький рейтинг</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        <Button
          variant={tab === 'pending' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setTab('pending')}
        >
          На модерації ({stats.pendingNovels})
        </Button>
        <Button
          variant={tab === 'no-cover' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setTab('no-cover')}
        >
          Без постеру ({stats.noCoverCount})
        </Button>
        <Button
          variant={tab === 'low-rating' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setTab('low-rating')}
        >
          Низький рейтинг ({stats.lowRatingCount})
        </Button>
        <Button
          variant={tab === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setTab('all')}
        >
          Всі тайтли
        </Button>
      </div>

      {/* Novels Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Тайтл</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Перегляди</TableHead>
              <TableHead>Рейтинг</TableHead>
              <TableHead>Дата</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Завантаження...
                </TableCell>
              </TableRow>
            ) : novels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Немає тайтлів
                </TableCell>
              </TableRow>
            ) : (
              novels.map((novel) => (
                <TableRow key={novel.id}>
                  <TableCell>
                    <Link href={`/novel/${novel.slug}`} className="hover:underline">
                      <div className="flex items-center gap-3">
                        {novel.coverUrl ? (
                          <img src={novel.coverUrl} alt="" className="h-10 w-8 rounded object-cover" />
                        ) : (
                          <div className="h-10 w-8 rounded bg-muted" />
                        )}
                        <div>
                          <p className="font-medium">{novel.title}</p>
                          <p className="text-xs text-muted-foreground">{novel.type}</p>
                        </div>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    {novel.moderationStatus === 'APPROVED' && (
                      <Badge variant="outline">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Схвалено
                      </Badge>
                    )}
                    {novel.moderationStatus === 'PENDING' && (
                      <Badge variant="default">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        На модерації
                      </Badge>
                    )}
                    {novel.moderationStatus === 'REJECTED' && (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Відхилено
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span>{novel.viewCount.toLocaleString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>{novel.averageRating.toFixed(1)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(novel.createdAt), 'dd MMM yyyy', { locale: uk })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
