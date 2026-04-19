'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TeamForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })

      if (res.ok) {
        const team = await res.json()
        router.push('/settings')
        router.refresh()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to create team')
      }
    } catch (error) {
      alert('Failed to create team')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/settings"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к настройкам
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Создание команды</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Название команды *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: MangaLib"
                className="mt-1"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Описание</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Опишите вашу команду..."
                className="mt-1 w-full rounded-md border bg-background p-3 text-sm"
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={isLoading || !name.trim()}>
                {isLoading ? 'Создание...' : 'Создать команду'}
              </Button>
              <Link href="/settings">
                <Button type="button" variant="outline">
                  Отмена
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
