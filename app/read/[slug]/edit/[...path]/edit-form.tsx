'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'react-toastify'
import { Loader2, Eye, Edit } from 'lucide-react'
import MarkdownToolbar from '@/components/markdown-toolbar'
import SafeMarkdown from '@/components/safe-markdown'

interface Chapter {
  id: string
  title: string
  number: number
  volume: number | null
  content: string
  teamId: string | null
  team?: {
    slug: string
    name: string
  } | null
}

interface ChapterEditFormProps {
  chapter: Chapter
  novelSlug: string
}

export default function ChapterEditForm({ chapter, novelSlug }: ChapterEditFormProps) {
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [title, setTitle] = useState(chapter.title)
  const [content, setContent] = useState(chapter.content)
  const [isLoading, setIsLoading] = useState(false)
  const [isPreview, setIsPreview] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch(`/api/chapters/${chapter.id}/edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      })

      if (res.ok) {
        toast.success('Розділ оновлено та відправлено на модерацію')
        const volStr = chapter.volume ? `${chapter.volume}.` : ''
        const teamPath = chapter.team?.slug ? `/${chapter.team.slug}` : ''
        router.push(`/read/${novelSlug}/${volStr}${chapter.number}${teamPath}`)
      } else {
        const error = await res.json()
        toast.error(error.error || 'Помилка при оновленні')
      }
    } catch (error) {
      toast.error('Помилка при оновленні')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Назва розділу</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Пролог"
              className="mt-1"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium">Зміст розділу</label>
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
            <p className="text-xs text-muted-foreground mb-2">
              Після збереження розділ буде відправлено на модерацію. Поки його не схвалено, на сайті відображатиметься попередня версія.
            </p>
            <div className="mt-1 rounded-md border">
              {!isPreview && (
                <MarkdownToolbar
                  textareaRef={textareaRef}
                  value={content}
                  onChange={setContent}
                />
              )}
              {isPreview ? (
                <div className="markdown-content p-4 min-h-[400px]">
                  {content ? (
                    <SafeMarkdown>{content}</SafeMarkdown>
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
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Зберегти та відправити на модерацію
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Скасувати
        </Button>
      </div>
    </form>
  )
}
