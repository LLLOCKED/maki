'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Eye, Edit } from 'lucide-react'
import MarkdownToolbar from '@/components/markdown-toolbar'
import ReactMarkdown from 'react-markdown'

interface Team {
  id: string
  name: string
}

export default function ChapterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const novelSlug = searchParams.get('novel')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [novelId, setNovelId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [number, setNumber] = useState('')
  const [content, setContent] = useState('')
  const [teamId, setTeamId] = useState('')
  const [teams, setTeams] = useState<Team[]>([])
  const [isPreview, setIsPreview] = useState(false)

  useEffect(() => {
    if (!novelSlug) return

    // Fetch novel by slug
    fetch(`/api/novels/${novelSlug}`)
      .then((r) => r.json())
      .then((novel) => {
        setNovelId(novel.id)
      })
  }, [novelSlug])

  useEffect(() => {
    // Fetch teams the user is a member of
    fetch('/api/teams?mine=true')
      .then((r) => r.json())
      .then(setTeams)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!novelId || !title || !number) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          number: parseInt(number),
          content,
          novelId,
          teamId: teamId || null,
        }),
      })

      if (res.ok) {
        const chapter = await res.json()
        router.push(`/novel/${novelSlug}`)
        router.refresh()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to create chapter')
      }
    } catch (error) {
      alert('Failed to create chapter')
    } finally {
      setIsLoading(false)
    }
  }

  if (!novelSlug) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground">Не вказано slug новелли</p>
        <Link href="/" className="text-primary hover:underline">
          На головну
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/novel/${novelSlug}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        До новелли
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Додавання розділу</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Номер розділу *</Label>
              <Input
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="1"
                type="number"
                className="mt-1 w-32"
                required
              />
            </div>

            <div>
              <Label>Назва розділу *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Розділ 1"
                className="mt-1"
                required
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Контент (Markdown)</Label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant={isPreview ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setIsPreview(false)}
                    className="h-8 gap-1"
                  >
                    <Edit className="h-4 w-4" />
                    Редактор
                  </Button>
                  <Button
                    type="button"
                    variant={isPreview ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setIsPreview(true)}
                    className="h-8 gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    Попередній перегляд
                  </Button>
                </div>
              </div>
              <div className="mt-1 rounded-md border">
                {!isPreview && (
                  <MarkdownToolbar
                    textareaRef={textareaRef}
                    value={content}
                    onChange={setContent}
                  />
                )}
                {isPreview ? (
                  <div className="prose dark:prose-invert max-w-none p-4">
                    {content ? (
                      <ReactMarkdown>{content}</ReactMarkdown>
                    ) : (
                      <p className="text-muted-foreground">Пусто...</p>
                    )}
                  </div>
                ) : (
                  <Textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="# Розділ 1&#10;&#10;Текст розділу..."
                    className="rounded-none border-0 font-mono"
                    rows={15}
                  />
                )}
              </div>
            </div>

            <div>
              <Label>Команда перекладу</Label>
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2"
              >
                <option value="">Без команди</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={isLoading || !novelId}>
                {isLoading ? 'Створення...' : 'Додати розділ'}
              </Button>
              <Link href={`/novel/${novelSlug}`}>
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
