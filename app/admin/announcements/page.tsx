'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, ArrowLeft, Upload } from 'lucide-react'
import Link from 'next/link'
import { FetchJsonError, safeFetchJson } from '@/lib/fetch-json'

interface Announcement {
  id: string
  title: string
  description: string | null
  posterUrl: string | null
  linkUrl: string
  linkType: string
  tag: string
  isActive: boolean
  sortOrder: number
}

const linkTypeOptions = [
  { value: 'novel', label: 'Тайтл' },
  { value: 'forum', label: 'Форум' },
  { value: 'page', label: 'Сторінка' },
  { value: 'external', label: 'Зовнішнє' },
]

const tagOptions = [
  { value: 'news', label: 'Новина', color: 'bg-blue-500' },
  { value: 'popular', label: 'Популярне', color: 'bg-green-500' },
  { value: 'attention', label: 'Увага', color: 'bg-red-500' },
  { value: 'new', label: 'Нове', color: 'bg-purple-500' },
  { value: 'featured', label: 'Рекомендація', color: 'bg-yellow-500' },
]

export default function AdminAnnouncementsPage() {
  const router = useRouter()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [posterUrl, setPosterUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkType, setLinkType] = useState('novel')
  const [tag, setTag] = useState('news')
  const [sortOrder, setSortOrder] = useState('0')
  const [isUploading, setIsUploading] = useState(false)

  const fetchAnnouncements = async () => {
    try {
      const data = await safeFetchJson<Announcement[]>('/api/announcements')
      setAnnouncements(data)
    } catch (error) {
      toast.error(error instanceof FetchJsonError ? error.message : 'Помилка завантаження оголошень')
      setAnnouncements([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setPosterUrl('')
    setLinkUrl('')
    setLinkType('novel')
    setTag('news')
    setSortOrder('0')
    setEditingId(null)
    setShowForm(false)
  }

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const data = await safeFetchJson<{ url?: string; error?: string }>('/api/upload', {
        method: 'POST',
        body: formData,
      })
      if (data.url) {
        setPosterUrl(data.url)
        toast.success('Постер завантажено')
      } else {
        toast.error(data.error || 'Помилка завантаження')
      }
    } catch {
      toast.error('Помилка завантаження')
    } finally {
      setIsUploading(false)
    }
  }

  const handleEdit = (ann: Announcement) => {
    setTitle(ann.title)
    setDescription(ann.description || '')
    setPosterUrl(ann.posterUrl || '')
    setLinkUrl(ann.linkUrl)
    setLinkType(ann.linkType)
    setTag(ann.tag)
    setSortOrder(ann.sortOrder.toString())
    setEditingId(ann.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Видалити це оголошення?')) return

    const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Оголошення видалено')
      fetchAnnouncements()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !linkUrl) {
      toast.error('Заповніть обов\'язкові поля')
      return
    }

    const payload = {
      title,
      description: description || null,
      posterUrl: posterUrl || null,
      linkUrl,
      linkType,
      tag,
      sortOrder: parseInt(sortOrder) || 0,
    }

    const url = editingId ? `/api/announcements/${editingId}` : '/api/announcements'
    const method = editingId ? 'PATCH' : 'POST'

    try {
      await safeFetchJson<Announcement>(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      toast.success(editingId ? 'Оголошення оновлено' : 'Оголошення створено')
      resetForm()
      fetchAnnouncements()
    } catch (error) {
      toast.error(error instanceof FetchJsonError ? error.message : 'Помилка збереження')
    }
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Link href="/admin" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Назад до адмінки
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Оголошення</CardTitle>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Додати
          </Button>
        </CardHeader>
        <CardContent>
          {showForm && (
            <form onSubmit={handleSubmit} className="mb-8 space-y-4 rounded-lg border p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Заголовок *</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} required className="mt-1" />
                </div>
                <div>
                  <Label>Тег *</Label>
                  <select value={tag} onChange={e => setTag(e.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2">
                    {tagOptions.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label>Опис</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} className="mt-1" rows={2} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Постер</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handlePosterUpload}
                      disabled={isUploading}
                      className="flex-1"
                    />
                    {isUploading && <span className="text-sm text-muted-foreground">Завантаження...</span>}
                  </div>
                  {posterUrl && (
                    <div className="mt-2 flex items-center gap-2">
                      <img src={posterUrl} alt="" className="h-12 w-16 rounded object-cover" />
                      <Input value={posterUrl} onChange={e => setPosterUrl(e.target.value)} placeholder="URL постера" className="flex-1" />
                    </div>
                  )}
                </div>
                <div>
                  <Label>Тип посилання *</Label>
                  <select value={linkType} onChange={e => setLinkType(e.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2">
                    {linkTypeOptions.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>URL для переходу *</Label>
                  <Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="/novel/slug" className="mt-1" required />
                </div>
                <div>
                  <Label>Порядок сортування</Label>
                  <Input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="mt-1" />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">{editingId ? 'Оновити' : 'Створити'}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Скасувати</Button>
              </div>
            </form>
          )}

          {isLoading ? (
            <p className="text-center text-muted-foreground">Завантаження...</p>
          ) : announcements.length === 0 ? (
            <p className="text-center text-muted-foreground">Немає оголошень</p>
          ) : (
            <div className="space-y-4">
              {announcements.map(ann => {
                const tagInfo = tagOptions.find(t => t.value === ann.tag)
                return (
                  <div key={ann.id} className="flex items-center gap-4 rounded-lg border p-4">
                    {ann.posterUrl && (
                      <img src={ann.posterUrl} alt="" className="h-16 w-12 rounded object-cover" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs text-white rounded ${tagInfo?.color || 'bg-gray-500'}`}>
                          {tagInfo?.label || ann.tag}
                        </span>
                        {!ann.isActive && <Badge variant="outline">Неактивне</Badge>}
                      </div>
                      <h4 className="font-medium">{ann.title}</h4>
                      <p className="text-sm text-muted-foreground">{ann.linkUrl}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(ann)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(ann.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
