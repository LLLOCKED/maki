'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSession } from 'next-auth/react'
import NovelSelector from '@/components/forum/novel-selector'
import { FetchJsonError, safeFetchJson } from '@/lib/fetch-json'

interface Category {
  id: string
  name: string
  slug: string
  color: string
}

interface Novel {
  id: string
  title: string
  slug: string
  coverUrl: string | null
}

export default function NewTopicPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [categories, setCategories] = useState<Category[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    safeFetchJson<Category[]>('/api/forum/categories')
      .then((data) => {
        setCategories(data)
        if (data.length > 0) {
          setCategoryId(data[0].id)
        }
      })
      .catch(() => setError('Не вдалося завантажити категорії форуму'))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim() || !categoryId) return

    setIsLoading(true)
    setError('')

    try {
      const topic = await safeFetchJson<{ id: string }>('/api/forum/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          categoryId,
          novelId: selectedNovel?.id || null,
        }),
      })
      router.push(`/forum/${topic.id}`)
    } catch (error) {
      setError(error instanceof FetchJsonError ? error.message : 'Помилка при створенні теми')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Завантаження...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="mx-auto max-w-2xl p-8 text-center">
          <p className="mb-4 text-muted-foreground">
            Для створення теми необхідно{' '}
            <Link href="/login" className="text-primary hover:underline">
              увійти
            </Link>
          </p>
          <Link href="/forum">
            <Button variant="outline">Повернутися до форуму</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/forum"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Повернутися до форуму
        </Link>
      </div>

      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Нова тема</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium">Категорії</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <NovelSelector onSelect={setSelectedNovel} selectedNovel={selectedNovel} />

            <div>
              <label className="mb-1 block text-sm font-medium">Заголовок</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Введіть заголовок теми"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Зміст</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Напишіть зміст теми..."
                rows={8}
                required
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Створення...' : 'Створити тему'}
              </Button>
              <Link href="/forum">
                <Button type="button" variant="outline">
                  Скасувати
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
