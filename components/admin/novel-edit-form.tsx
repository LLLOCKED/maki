'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Genre {
  id: string
  name: string
  slug: string
}

interface Tag {
  id: string
  name: string
  slug: string
}

interface Publisher {
  id: string
  name: string
  slug: string
}

interface Author {
  id: string
  name: string
  slug: string
}

interface Novel {
  id: string
  title: string
  originalName: string | null
  slug: string
  description: string
  coverUrl: string | null
  type: string
  status: string
  translationStatus: string
  releaseYear: number | null
  sourceUrl: string | null
  isExplicit: boolean
  contentWarnings: string[]
  donationUrl: string | null
  genres: { genre: Genre }[]
  tags: { tag: Tag }[]
  publishers: { publisher: Publisher }[]
  authors: { author: Author }[]
}

const typeOptions = [
  { value: 'ORIGINAL', label: 'Авторський' },
  { value: 'JAPAN', label: 'Японія' },
  { value: 'KOREA', label: 'Корея' },
  { value: 'CHINA', label: 'Китай' },
  { value: 'ENGLISH', label: 'Англійська' },
]

const statusOptions = [
  { value: 'ONGOING', label: 'Онгоінг' },
  { value: 'COMPLETED', label: 'Завершено' },
  { value: 'SUSPENDED', label: 'Призупинено' },
]

const translationStatusOptions = [
  { value: 'TRANSLATING', label: 'Перекладається' },
  { value: 'HIATUS', label: 'На паузі' },
  { value: 'DROPPED', label: 'Залишено' },
  { value: 'COMPLETED', label: 'Завершено' },
]

const contentWarningOptions = [
  { value: 'violence', label: 'Насилля', color: 'bg-red-500' },
  { value: 'gore', label: 'Кров\'яні сцени', color: 'bg-red-700' },
  { value: 'sexual', label: 'Сексуальний контент', color: 'bg-purple-500' },
  { value: 'psychological', label: 'Психологічний тиск', color: 'bg-yellow-500' },
  { value: 'self-harm', label: 'Самогубство/самопошкодження', color: 'bg-orange-500' },
]

export default function NovelEditForm({ novel }: { novel: Novel }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Form fields
  const [title, setTitle] = useState(novel.title)
  const [originalName, setOriginalName] = useState(novel.originalName || '')
  const [slug, setSlug] = useState(novel.slug)
  const [description, setDescription] = useState(novel.description)
  const [coverUrl, setCoverUrl] = useState(novel.coverUrl || '')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(novel.coverUrl)
  const [type, setType] = useState(novel.type)
  const [status, setStatus] = useState(novel.status)
  const [translationStatus, setTranslationStatus] = useState(novel.translationStatus)
  const [releaseYear, setReleaseYear] = useState(novel.releaseYear?.toString() || '')
  const [sourceUrl, setSourceUrl] = useState(novel.sourceUrl || '')
  const [isExplicit, setIsExplicit] = useState(novel.isExplicit)
  const [contentWarnings, setContentWarnings] = useState<string[]>(novel.contentWarnings || [])
  const [donationUrl, setDonationUrl] = useState(novel.donationUrl || '')

  // Options
  const [genres, setGenres] = useState<Genre[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [publishers, setPublishers] = useState<Publisher[]>([])
  const [authors, setAuthors] = useState<Author[]>([])

  // Selected
  const [selectedGenres, setSelectedGenres] = useState<string[]>(novel.genres.map(g => g.genre.id))
  const [selectedTags, setSelectedTags] = useState<string[]>(novel.tags.map(t => t.tag.id))
  const [selectedPublishers, setSelectedPublishers] = useState<string[]>(novel.publishers.map(p => p.publisher.id))
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>(novel.authors.map(a => a.author.id))

  // New items
  const [newPublisher, setNewPublisher] = useState('')
  const [newAuthor, setNewAuthor] = useState('')
  const [newTag, setNewTag] = useState('')

  // Fetch options
  useEffect(() => {
    Promise.all([
      fetch('/api/genres').then((r) => r.json()),
      fetch('/api/tags').then((r) => r.json()),
      fetch('/api/publishers').then((r) => r.json()),
      fetch('/api/authors').then((r) => r.json()),
    ]).then(([g, t, p, a]) => {
      setGenres(g)
      setTags(t)
      setPublishers(p)
      setAuthors(a)
    })
  }, [])

  async function handleAddPublisher() {
    if (!newPublisher.trim()) return
    const res = await fetch('/api/publishers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newPublisher }),
    })
    if (res.ok) {
      const pub = await res.json()
      setPublishers([...publishers, pub])
      setSelectedPublishers([...selectedPublishers, pub.id])
      setNewPublisher('')
    }
  }

  async function handleAddAuthor() {
    if (!newAuthor.trim()) return
    const res = await fetch('/api/authors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newAuthor }),
    })
    if (res.ok) {
      const author = await res.json()
      setAuthors([...authors, author])
      setSelectedAuthors([...selectedAuthors, author.id])
      setNewAuthor('')
    }
  }

  async function handleAddTag() {
    if (!newTag.trim()) return
    const res = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTag }),
    })
    if (res.ok) {
      const tag = await res.json()
      setTags([...tags, tag])
      setSelectedTags([...selectedTags, tag.id])
      setNewTag('')
    }
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setCoverFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !slug || slug.length < 3 || !description) return

    setIsLoading(true)
    try {
      let newCoverUrl = coverUrl

      if (coverFile) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', coverFile)
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        })
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          newCoverUrl = uploadData.url
        }
      }

      const res = await fetch(`/api/novels/${novel.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          originalName: originalName || null,
          description,
          coverUrl: newCoverUrl,
          type,
          status,
          translationStatus,
          releaseYear: releaseYear ? parseInt(releaseYear) : null,
          genreIds: selectedGenres,
          tagIds: selectedTags,
          publisherIds: selectedPublishers,
          authorIds: selectedAuthors,
          sourceUrl: sourceUrl || null,
          isExplicit,
          contentWarnings,
          donationUrl: donationUrl || null,
        }),
      })

      if (res.ok) {
        toast.success('Тайтл оновлено')
        router.push(`/novel/${novel.slug}`)
        router.refresh()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update novel')
      }
    } catch (error) {
      alert('Failed to update novel')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <Link
        href="/admin/novels"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Редагування тайтлу</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Назва *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label>Оригінальна назва</Label>
                <Input
                  value={originalName}
                  onChange={(e) => setOriginalName(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>URL-slug *</Label>
              <Input
                value={slug}
                onChange={(e) => {
                  const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                  setSlug(value)
                }}
                className="mt-1"
                required
              />
              {slug.length > 0 && slug.length < 3 && (
                <p className="mt-1 text-xs text-destructive">Мінімум 3 символи</p>
              )}
            </div>

            <div>
              <Label>Опис *</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
                rows={4}
                required
              />
            </div>

            <div>
              <Label>Обкладинка</Label>
              <div className="mt-1 flex items-center gap-4">
                <label className="flex h-10 cursor-pointer items-center rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-muted/50">
                  <span className="mr-2">Обрати файл</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="hidden"
                  />
                </label>
                {coverPreview && (
                  <div className="relative aspect-[3/4] w-20 overflow-hidden rounded-md border">
                    <img
                      src={coverPreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Selects */}
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Тип</Label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                >
                  {typeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Статус тайтлу</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Статус перекладу</Label>
                <select
                  value={translationStatus}
                  onChange={(e) => setTranslationStatus(e.target.value)}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                >
                  {translationStatusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Рік випуску</Label>
                <Input
                  value={releaseYear}
                  onChange={(e) => setReleaseYear(e.target.value)}
                  placeholder="2024"
                  type="number"
                  className="mt-1 w-32"
                />
              </div>

              <div>
                <Label>URL джерела перекладу</Label>
                <Input
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Посилання на донати</Label>
              <Input
                value={donationUrl}
                onChange={(e) => setDonationUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1"
              />
            </div>

            {/* Content Warnings */}
            <div className="space-y-2">
              <Label>Попередження про контент</Label>
              <div className="flex flex-wrap gap-2">
                {contentWarningOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      contentWarnings.includes(option.value)
                        ? `${option.color} border-transparent text-white`
                        : 'border-input bg-background hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={contentWarnings.includes(option.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setContentWarnings([...contentWarnings, option.value])
                          setIsExplicit(true)
                        } else {
                          setContentWarnings(contentWarnings.filter(warning => warning !== option.value))
                        }
                      }}
                      className="hidden"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Genres */}
            <div>
              <Label className="mb-2 block">Жанри</Label>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <label
                    key={genre.id}
                    className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm hover:bg-accent cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedGenres.includes(genre.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedGenres([...selectedGenres, genre.id])
                        } else {
                          setSelectedGenres(selectedGenres.filter((id) => id !== genre.id))
                        }
                      }}
                    />
                    {genre.name}
                  </label>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label className="mb-2 block">Теги</Label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <label
                      key={tag.id}
                      className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm hover:bg-accent cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedTags.includes(tag.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTags([...selectedTags, tag.id])
                          } else {
                            setSelectedTags(selectedTags.filter((id) => id !== tag.id))
                          }
                        }}
                      />
                      {tag.name}
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Новий тег"
                    className="w-48"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleAddTag}>
                    +
                  </Button>
                </div>
              </div>
            </div>

            {/* Publishers */}
            <div>
              <Label className="mb-2 block">Видавці</Label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {publishers.map((pub) => (
                    <label
                      key={pub.id}
                      className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm hover:bg-accent cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedPublishers.includes(pub.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPublishers([...selectedPublishers, pub.id])
                          } else {
                            setSelectedPublishers(selectedPublishers.filter((id) => id !== pub.id))
                          }
                        }}
                      />
                      {pub.name}
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newPublisher}
                    onChange={(e) => setNewPublisher(e.target.value)}
                    placeholder="Новий видавець"
                    className="w-48"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleAddPublisher}>
                    +
                  </Button>
                </div>
              </div>
            </div>

            {/* Authors */}
            <div>
              <Label className="mb-2 block">Автори</Label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {authors.map((author) => (
                    <label
                      key={author.id}
                      className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm hover:bg-accent cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedAuthors.includes(author.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedAuthors([...selectedAuthors, author.id])
                          } else {
                            setSelectedAuthors(selectedAuthors.filter((id) => id !== author.id))
                          }
                        }}
                      />
                      {author.name}
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder="Новий автор"
                    className="w-48"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleAddAuthor}>
                    +
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 items-center">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Збереження...' : 'Зберегти зміни'}
              </Button>
              <Link href="/admin/novels">
                <Button type="button" variant="outline">
                  Скасувати
                </Button>
              </Link>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={isExplicit}
                  onCheckedChange={(checked) => setIsExplicit(!!checked)}
                />
                <span>18+</span>
              </label>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
