'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Search, BookOpen, Users, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

interface SearchResult {
  type: 'novel' | 'team' | 'user'
  id: string
  title: string
  subtitle?: string
  coverUrl?: string | null
}

export default function SearchPageContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data)
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const novels = results.filter((r) => r.type === 'novel')
  const teams = results.filter((r) => r.type === 'team')
  const users = results.filter((r) => r.type === 'user')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-4 text-2xl font-bold">Поиск</h1>
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Введите название тайтла, команды или пользователя..."
            className="pl-10"
            autoFocus
          />
        </div>
      </div>

      {isLoading && (
        <div className="text-center text-muted-foreground">Поиск...</div>
      )}

      {!isLoading && query.length >= 2 && results.length === 0 && (
        <div className="text-center text-muted-foreground">
          Ничего не найдено по запросу &quot;{query}&quot;
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <div className="space-y-8">
          {/* Novels */}
          {novels.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                <BookOpen className="h-5 w-5 text-primary" />
                Тайтлы ({novels.length})
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
                Команды ({teams.length})
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
                Пользователи ({users.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {users.map((user) => (
                  <Link key={user.id} href={`/user/${user.id}`}>
                    <Card className="p-4 transition-shadow hover:shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-medium">{user.title}</h3>
                          {user.subtitle && (
                            <p className="text-xs text-muted-foreground">
                              {user.subtitle}
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
        </div>
      )}

      {!isLoading && query.length < 2 && (
        <div className="text-center text-muted-foreground">
          Введите минимум 2 символа для поиска
        </div>
      )}
    </div>
  )
}
