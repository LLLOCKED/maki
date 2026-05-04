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
import { ArrowLeft, Plus } from 'lucide-react'

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
}

interface Author {
  id: string
  name: string
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

export default function NovelForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Form fields
  const [title, setTitle] = useState('')
  const [originalName, setOriginalName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [type, setType] = useState('ORIGINAL')
  const [status, setStatus] = useState('ONGOING')
  const [translationStatus, setTranslationStatus] = useState('TRANSLATING')
  const [releaseYear, setReleaseYear] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [isExplicit, setIsExplicit] = useState(false)
  const [contentWarnings, setContentWarnings] = useState<string[]>([])
  const [donationUrl, setDonationUrl] = useState('')

  const contentWarningOptions = [
    { value: 'violence', label: 'Насилля', color: 'bg-red-500' },
    { value: 'gore', label: 'Кров\'яні сцени', color: 'bg-red-700' },
    { value: 'sexual', label: 'Сексуальний контент', color: 'bg-purple-500' },
    { value: 'psychological', label: 'Психологічний тиск', color: 'bg-yellow-500' },
    { value: 'self-harm', label: 'Самогубство/самопошкодження', color: 'bg-orange-500' },
  ]

  // Options
  const [genres, setGenres] = useState<Genre[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [publishers, setPublishers] = useState<Publisher[]>([])
  const [authors, setAuthors] = useState<Author[]>([])

  // Selected
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedPublishers, setSelectedPublishers] = useState<string[]>([])
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([])

  // New items
  const [newPublisher, setNewPublisher] = useState('')
  const [newAuthor, setNewAuthor] = useState('')
  const [newTag, setNewTag] = useState('')

  // Generate URL-friendly slug from title (with Ukrainian transliteration)
  const generateSlug = (text: string): string => {
    const translitMap: { [key: string]: string } = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd', 'е': 'e', 'є': 'ye',
      'ж': 'zh', 'з': 'z', 'и': 'y', 'і': 'i', 'ї': 'yi', 'й': 'y', 'к': 'k', 'л': 'l',
      'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
      'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '',
      'ю': 'yu', 'я': 'ya', ' ': '-', '№': 'n'
    }

    return text
      .toLowerCase()
      .split('')
      .map(char => {
        if (translitMap[char] !== undefined) return translitMap[char]
        return /^[a-z0-9]$/.test(char) ? char : ''
      })
      .join('')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  useEffect(() => {
    // Generate slug from original name (prioritize), fallback to title
    const source = originalName || title
    if (source && !slug) {
      setSlug(generateSlug(source))
    }
  }, [title, slug, originalName])

  // Fetch options only once on mount
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
    console.log('File selected:', file)
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
      let coverUrl: string | null = null

      if (coverFile) {
        console.log('Uploading cover:', coverFile.name, coverFile.size, coverFile.type)
        const uploadFormData = new FormData()
        uploadFormData.append('file', coverFile)
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        })
        console.log('Upload response:', uploadRes.status)
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          console.log('Upload data:', uploadData)
          coverUrl = uploadData.url
        } else {
          const err = await uploadRes.json()
          console.error('Upload failed:', err)
        }
      }

      const res = await fetch('/api/novels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          originalName: originalName || null,
          slug,
          description,
          coverUrl: coverUrl || null,
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
        toast.success('Тайтл відправлено на модерацію')
        router.push('/')
        router.refresh()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to create novel')
      }
    } catch (error) {
      alert('Failed to create novel')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        На головну
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Додавання тайтлу</CardTitle>
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
                  placeholder="Наприклад: Магічний господар"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label>Оригінальна назва</Label>
                <Input
                  value={originalName}
                  onChange={(e) => setOriginalName(e.target.value)}
                  placeholder="Японською/корейською/китайською"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>URL-slug *</Label>
              <Input
                value={slug}
                onChange={(e) => {
                  // Only allow Latin letters and numbers
                  const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                  setSlug(value)
                }}
                placeholder="url-friendly-slug"
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
                placeholder="Опис новели..."
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

            <div>
              <Label>Посилання на донати</Label>
              <Input
                value={donationUrl}
                onChange={(e) => setDonationUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1"
              />
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
                          setSelectedGenres(
                            selectedGenres.filter((id) => id !== genre.id)
                          )
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
                            setSelectedTags(
                              selectedTags.filter((id) => id !== tag.id)
                            )
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddTag}
                  >
                    <Plus className="h-4 w-4" />
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
                            setSelectedPublishers(
                              selectedPublishers.filter((id) => id !== pub.id)
                            )
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddPublisher}
                  >
                    <Plus className="h-4 w-4" />
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
                            setSelectedAuthors(
                              selectedAuthors.filter((id) => id !== author.id)
                            )
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddAuthor}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 items-center">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Створення...' : 'Створити нову'}
              </Button>
              <Link href="/">
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

            {/* Content Warnings */}
            <div className="space-y-2">
              <Label>Попередження про контент</Label>
              <div className="flex flex-wrap gap-2">
                {contentWarningOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm cursor-pointer border transition-colors ${
                      contentWarnings.includes(option.value)
                        ? `${option.color} text-white border-transparent`
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
                          setContentWarnings(contentWarnings.filter(w => w !== option.value))
                        }
                      }}
                      className="hidden"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
