'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { safeFetchJson } from '@/lib/fetch-json'
import { cn } from '@/lib/utils'

interface Novel {
  id: string
  title: string
  slug: string
  coverUrl: string | null
}

interface NovelSelectorProps {
  onSelect: (novel: Novel | null) => void
  selectedNovel: Novel | null
}

export default function NovelSelector({ onSelect, selectedNovel }: NovelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [novels, setNovels] = useState<Novel[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const searchNovels = async () => {
      setIsLoading(true)
      try {
        const data = await safeFetchJson<{ novels?: Novel[] }>(`/api/novels?search=${encodeURIComponent(search)}&limit=10`)
        setNovels(data.novels || [])
      } catch {
        setNovels([])
      } finally {
        setIsLoading(false)
      }
    }

    const debounce = setTimeout(searchNovels, 300)
    return () => clearTimeout(debounce)
  }, [search, isOpen])

  const handleSelect = (novel: Novel) => {
    onSelect(novel)
    setSearch('')
    setIsOpen(false)
  }

  const handleClear = () => {
    onSelect(null)
    setSearch('')
  }

  return (
    <div className="relative">
      <label className="mb-1 block text-sm font-medium">Прив&apos;язати до тайтлу</label>

      {selectedNovel ? (
        <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
          <span className="flex-1 truncate text-sm">{selectedNovel.title}</span>
          <button
            type="button"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          className={cn(
            'flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 cursor-pointer',
            isOpen && 'border-primary'
          )}
          onClick={() => {
            setIsOpen(true)
            inputRef.current?.focus()
          }}
        >
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 text-sm text-muted-foreground">Пошук тайтлу...</span>
        </div>
      )}

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-background shadow-lg">
          <div className="p-2">
            <Input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Введіть назву тайтлу..."
              className="h-9"
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="p-2 text-center text-sm text-muted-foreground">
                Пошук...
              </div>
            ) : novels.length === 0 ? (
              <div className="p-2 text-center text-sm text-muted-foreground">
                Нічого не знайдено
              </div>
            ) : (
              novels.map((novel) => (
                <button
                  key={novel.id}
                  type="button"
                  onClick={() => handleSelect(novel)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted"
                >
                  <div className="h-8 w-6 overflow-hidden rounded bg-muted">
                    {novel.coverUrl && (
                      <img
                        src={novel.coverUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <span className="truncate text-sm">{novel.title}</span>
                </button>
              ))
            )}
          </div>

          <div className="border-t p-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                setSearch('')
              }}
              className="w-full rounded-md px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
            >
              Скасувати
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
