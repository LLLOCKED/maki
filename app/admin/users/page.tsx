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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { User, Ban, AlertTriangle, CheckCircle } from 'lucide-react'

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'banned' | 'warned'>('all')

  const [warnDialog, setWarnDialog] = useState<{ open: boolean; userId: string; userName: string }>({
    open: false,
    userId: '',
    userName: '',
  })
  const [banDialog, setBanDialog] = useState<{ open: boolean; userId: string; userName: string; isBanned: boolean }>({
    open: false,
    userId: '',
    userName: '',
    isBanned: false,
  })
  const [warnReason, setWarnReason] = useState('')
  const [banReason, setBanReason] = useState('')
  const [warnings, setWarnings] = useState<any[]>([])

  useEffect(() => {
    fetchUsers()
  }, [search, filter])

  async function fetchUsers() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filter === 'banned') params.set('banned', 'true')

      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleWarn() {
    if (!warnReason.trim()) return
    try {
      await fetch(`/api/admin/users/${warnDialog.userId}/warn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: warnReason }),
      })
      setWarnDialog({ ...warnDialog, open: false })
      setWarnReason('')
      fetchUsers()
    } catch (error) {
      console.error('Error issuing warning:', error)
    }
  }

  async function handleBan() {
    try {
      await fetch(`/api/admin/users/${banDialog.userId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ban: !banDialog.isBanned, reason: banReason }),
      })
      setBanDialog({ ...banDialog, open: false })
      setBanReason('')
      fetchUsers()
    } catch (error) {
      console.error('Error updating ban:', error)
    }
  }

  async function showWarnings(userId: string) {
    const res = await fetch(`/api/admin/users/${userId}/warn`)
    const data = await res.json()
    setWarnings(data)
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold">Користувачі</h1>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Пошук по імені або email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Всі
          </Button>
          <Button
            variant={filter === 'banned' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('banned')}
          >
            Забанені
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Користувач</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Попереджень</TableHead>
              <TableHead>Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Завантаження...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Користувачів не знайдено
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {user.image ? (
                        <img src={user.image} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{user.name || 'Без імені'}</p>
                        <p className="text-xs text-muted-foreground">{user.email || '-'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {user.isBanned ? (
                      <Badge variant="destructive">
                        <Ban className="h-3 w-3 mr-1" />
                        Забанен
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Активний
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => showWarnings(user.id)}>
                      {user._count?.warnings || 0}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWarnDialog({ open: true, userId: user.id, userName: user.name || 'User' })}
                      >
                        <AlertTriangle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={user.isBanned ? 'outline' : 'destructive'}
                        size="sm"
                        onClick={() => setBanDialog({ open: true, userId: user.id, userName: user.name || 'User', isBanned: user.isBanned })}
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Warn Dialog */}
      <Dialog open={warnDialog.open} onOpenChange={(open) => setWarnDialog({ ...warnDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Видати попередження</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Користувач: <strong>{warnDialog.userName}</strong>
            </p>
            <Input
              placeholder="Причина попередження..."
              value={warnReason}
              onChange={(e) => setWarnReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWarnDialog({ ...warnDialog, open: false })}>
              Скасувати
            </Button>
            <Button onClick={handleWarn} disabled={!warnReason.trim()}>
              Видати попередження
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban Dialog */}
      <Dialog open={banDialog.open} onOpenChange={(open) => setBanDialog({ ...banDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {banDialog.isBanned ? 'Розбаненти користувача' : 'Забанити користувача'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Користувач: <strong>{banDialog.userName}</strong>
            </p>
            {!banDialog.isBanned && (
              <Input
                placeholder="Причина бана..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialog({ ...banDialog, open: false })}>
              Скасувати
            </Button>
            <Button variant={banDialog.isBanned ? 'default' : 'destructive'} onClick={handleBan}>
              {banDialog.isBanned ? 'Розбанити' : 'Забанити'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warnings Dialog */}
      <Dialog open={warnings.length > 0} onOpenChange={() => setWarnings([])}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Попередження користувача</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {warnings.length === 0 ? (
              <p className="text-muted-foreground">Немає попереджень</p>
            ) : (
              warnings.map((w) => (
                <div key={w.id} className="rounded-md border p-3">
                  <p className="text-sm">{w.reason}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(w.createdAt), 'dd MMM yyyy HH:mm', { locale: uk })} · {w.issuer?.name || 'Admin'}
                  </p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}