'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Trash2, Plus, Palette } from 'lucide-react'

interface Genre {
  id: string
  name: string
  slug: string
}

interface ForumCategory {
  id: string
  name: string
  slug: string
  description: string | null
  color: string
  order: number
}

export default function AdminSettingsPage() {
  const [genres, setGenres] = useState<Genre[]>([])
  const [categories, setCategories] = useState<ForumCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // New genre form
  const [newGenreName, setNewGenreName] = useState('')
  const [newGenreSlug, setNewGenreSlug] = useState('')

  // New category form
  const [newCatName, setNewCatName] = useState('')
  const [newCatSlug, setNewCatSlug] = useState('')
  const [newCatDescription, setNewCatDescription] = useState('')
  const [newCatColor, setNewCatColor] = useState('#6366f1')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [genresRes, catsRes] = await Promise.all([
        fetch('/api/admin/genres'),
        fetch('/api/admin/forum-categories'),
      ])
      const [genresData, catsData] = await Promise.all([
        genresRes.json(),
        catsRes.json(),
      ])
      setGenres(genresData)
      setCategories(catsData)
    } catch (error) {
      toast.error('Помилка завантаження даних')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAddGenre(e: React.FormEvent) {
    e.preventDefault()
    if (!newGenreName) return

    const slug = newGenreSlug || newGenreName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    try {
      const res = await fetch('/api/admin/genres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGenreName, slug }),
      })
      if (res.ok) {
        const genre = await res.json()
        setGenres([...genres, genre])
        setNewGenreName('')
        setNewGenreSlug('')
        toast.success('Жанр додано')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Помилка')
      }
    } catch {
      toast.error('Помилка')
    }
  }

  async function handleDeleteGenre(id: string) {
    if (!confirm('Видалити жанр?')) return
    try {
      const res = await fetch(`/api/admin/genres?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setGenres(genres.filter(g => g.id !== id))
        toast.success('Жанр видалено')
      } else {
        toast.error('Помилка')
      }
    } catch {
      toast.error('Помилка')
    }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!newCatName || !newCatSlug) return

    try {
      const res = await fetch('/api/admin/forum-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCatName,
          slug: newCatSlug,
          description: newCatDescription || null,
          color: newCatColor,
        }),
      })
      if (res.ok) {
        const cat = await res.json()
        setCategories([...categories, cat])
        setNewCatName('')
        setNewCatSlug('')
        setNewCatDescription('')
        setNewCatColor('#6366f1')
        toast.success('Категорію додано')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Помилка')
      }
    } catch {
      toast.error('Помилка')
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm('Видалити категорію?')) return
    try {
      const res = await fetch(`/api/admin/forum-categories?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setCategories(categories.filter(c => c.id !== id))
        toast.success('Категорію видалено')
      } else {
        toast.error('Помилка')
      }
    } catch {
      toast.error('Помилка')
    }
  }

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Завантаження...</div>
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Налаштування</h1>

      {/* Genres */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Жанри</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddGenre} className="flex gap-2 mb-6">
            <Input
              value={newGenreName}
              onChange={(e) => setNewGenreName(e.target.value)}
              placeholder="Назва жанру"
              className="max-w-xs"
            />
            <Input
              value={newGenreSlug}
              onChange={(e) => setNewGenreSlug(e.target.value)}
              placeholder="slug (авто)"
              className="max-w-xs"
            />
            <Button type="submit">
              <Plus className="h-4 w-4 mr-1" />
              Додати
            </Button>
          </form>

          <div className="space-y-2">
            {genres.map((genre) => (
              <div
                key={genre.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div>
                  <span className="font-medium">{genre.name}</span>
                  <span className="text-muted-foreground text-sm ml-2">
                    /{genre.slug}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteGenre(genre.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {genres.length === 0 && (
              <p className="text-muted-foreground text-sm">Немає жанрів</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Forum Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Категорії форуму
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddCategory} className="space-y-4 mb-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Назва</Label>
                <Input
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Новини"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Slug</Label>
                <Input
                  value={newCatSlug}
                  onChange={(e) => setNewCatSlug(e.target.value)}
                  placeholder="news"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Опис</Label>
              <Input
                value={newCatDescription}
                onChange={(e) => setNewCatDescription(e.target.value)}
                placeholder="Опис категорії"
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-4">
              <div>
                <Label>Колір</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <span className="text-sm text-muted-foreground">{newCatColor}</span>
                </div>
              </div>
              <div className="flex-1">
                <Label>&nbsp;</Label>
                <Button type="submit" className="mt-1">
                  <Plus className="h-4 w-4 mr-1" />
                  Додати категорію
                </Button>
              </div>
            </div>
          </form>

          <div className="space-y-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div>
                    <span className="font-medium">{cat.name}</span>
                    <span className="text-muted-foreground text-sm ml-2">
                      /{cat.slug}
                    </span>
                    {cat.description && (
                      <p className="text-muted-foreground text-xs">{cat.description}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteCategory(cat.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-muted-foreground text-sm">Немає категорій</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}