'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { MessageSquare, Search, BookOpen, Users, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import UserPresence, { OnlineDot } from '@/components/user-presence'

interface SearchResult {
  type: 'novel' | 'team' | 'user' | 'forum'
  id: string
  title: string
  subtitle?: string
  content?: string
  coverUrl?: string | null
  lastSeen?: Date | string | null
}

export default function SearchPageContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [typeFilter, setTypeFilter] = useState<'all' | 'novel' | 'team' | 'user' | 'forum'>('all')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setError('')
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${typeFilter}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data)
        } else {
          setResults([])
          setError('Не вдалось виконати пошук')
        }
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
        setError('Не вдалось виконати пошук')
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, typeFilter])

  const novels = results.filter((r) => r.type === 'novel')
  const teams = results.filter((r) => r.type === 'team')
  const users = results.filter((r) => r.type === 'user')
  const topics = results.filter((r) => r.type === 'forum')
  const filters = [
    { value: 'all', label: 'Усе' },
    { value: 'novel', label: 'Тайтли' },
    { value: 'team', label: 'Команди' },
    { value: 'user', label: 'Користувачі' },
    { value: 'forum', label: 'Форум' },
  ] as const

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-4 text-2xl font-bold">Пошук</h1>
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Введіть назву тайтлу, команди або користувача..."
            className="pl-10"
            autoFocus
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setTypeFilter(filter.value)}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                typeFilter === filter.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-lg border bg-muted/40" />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {!isLoading && !error && query.length >= 2 && results.length === 0 && (
        <div className="rounded-md border bg-card p-8 text-center text-muted-foreground">
          Нічого не знайдено за запитом &quot;{query}&quot;
        </div>
      )}

      {!isLoading && !error && results.length > 0 && (
        <div className="space-y-8">
          {/* Novels */}
          {novels.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                <BookOpen className="h-5 w-5 text-primary" />
                Тайтли ({novels.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {novels.map((novel) => (
                  <Link key={novel.id} href={`/novel/${novel.id}`}>
                    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
                      <div className="relative aspect-[3/4] bg-muted">
                        {novel.coverUrl ? (
                          <Image
                            src={novel.coverUrl}
                            alt={novel.title}
                            fill
                            className="object-cover"
                          />
                          ) : (
                          <div className="flex h-full items-center justify-center">
                            <BookOpen className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="line-clamp-2 text-sm font-medium">
                          {novel.title}
                        </h3>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Teams */}
          {teams.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                <Users className="h-5 w-5 text-accent" />
                Команди ({teams.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {teams.map((team) => (
                  <Link key={team.id} href={`/team/${team.id}`}>
                    <Card className="p-4 transition-shadow hover:shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <Users className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <h3 className="font-medium">{team.title}</h3>
                          {team.subtitle && (
                            <p className="text-xs text-muted-foreground">
                              {team.subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Users */}
          {users.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                <User className="h-5 w-5 text-muted-foreground" />
                Користувачі ({users.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {users.map((user) => (
                  <Link key={user.id} href={`/user/${user.id}`}>
                    <Card className="p-4 transition-shadow hover:shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          {user.coverUrl ? (
                            <img src={user.coverUrl} alt={user.title} className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <User className="h-5 w-5 text-muted-foreground" />
                          )}
                          <OnlineDot lastSeen={user.lastSeen} className="absolute bottom-0 right-0 h-3 w-3 border-2" />
                        </div>
                        <div>
                          <h3 className="font-medium">{user.title}</h3>
                          <UserPresence lastSeen={user.lastSeen} compact />
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {topics.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                <MessageSquare className="h-5 w-5 text-green-500" />
                Форум ({topics.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {topics.map((topic) => (
                  <Link key={topic.id} href={`/forum/${topic.id}`}>
                    <Card className="p-4 transition-shadow hover:shadow-lg">
                      <h3 className="line-clamp-1 font-medium">{topic.title}</h3>
                      {topic.subtitle && (
                        <p className="mt-1 text-xs text-muted-foreground">{topic.subtitle}</p>
                      )}
                      {topic.content && (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{topic.content}</p>
                      )}
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {!isLoading && query.length < 2 && (
        <div className="text-center text-muted-foreground">
          Введіть мінімум 2 символи для пошуку
        </div>
      )}
    </div>
  )
}
