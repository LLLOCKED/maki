'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react'

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

interface Author {
  id: string
  name: string
  slug: string
}

interface CatalogFiltersProps {
  genres: Genre[]
  tags: Tag[]
  authors: Author[]
  variant?: 'toolbar' | 'sidebar'
}

const typeOptions = [
  { value: 'JAPAN', label: 'Японія' },
  { value: 'KOREA', label: 'Корея' },
  { value: 'CHINA', label: 'Китай' },
  { value: 'ENGLISH', label: 'Англійська' },
  { value: 'ORIGINAL', label: 'Авторський' },
]

const statusOptions = [
  { value: 'ONGOING', label: 'Онгоінг' },
  { value: 'COMPLETED', label: 'Завершено' },
  { value: 'SUSPENDED', label: 'Призупинено' },
]

const translationStatusOptions = [
  { value: 'TRANSLATING', label: 'Перекладається' },
  { value: 'COMPLETED', label: 'Завершено' },
  { value: 'DROPPED', label: 'Залишено' },
  { value: 'HIATUS', label: 'На паузі' },
]

const sortOptions = [
  { value: 'title', label: 'За назвою' },
  { value: 'rating', label: 'За рейтингом' },
  { value: 'views', label: 'За переглядами' },
  { value: 'year', label: 'За роком' },
  { value: 'created', label: 'За датою додавання' },
]

export default function CatalogFilters({ genres, tags, authors, variant = 'toolbar' }: CatalogFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const getParam = (key: string) => searchParams.get(key) || ''

  const [search, setSearch] = useState(getParam('search'))
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    getParam('genres').split(',').filter(Boolean)
  )
  const [selectedTags, setSelectedTags] = useState<string[]>(
    getParam('tags').split(',').filter(Boolean)
  )
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>(
    getParam('authors').split(',').filter(Boolean)
  )
  const [selectedType, setSelectedType] = useState(getParam('type'))
  const [selectedStatus, setSelectedStatus] = useState(getParam('status'))
  const [selectedTranslationStatus, setSelectedTranslationStatus] = useState(getParam('translationStatus'))
  const [yearFrom, setYearFrom] = useState(getParam('yearFrom'))
  const [yearTo, setYearTo] = useState(getParam('yearTo'))
  const [sortBy, setSortBy] = useState(getParam('sortBy') || 'title')
  const [sortOrder, setSortOrder] = useState(getParam('sortOrder') || 'asc')

  const [isExpanded, setIsExpanded] = useState(false)

  // Sync state when URL changes (e.g., browser back/forward)
  useEffect(() => {
    setSearch(getParam('search'))
    setSelectedGenres(getParam('genres').split(',').filter(Boolean))
    setSelectedTags(getParam('tags').split(',').filter(Boolean))
    setSelectedAuthors(getParam('authors').split(',').filter(Boolean))
    setSelectedType(getParam('type'))
    setSelectedStatus(getParam('status'))
    setSelectedTranslationStatus(getParam('translationStatus'))
    setYearFrom(getParam('yearFrom'))
    setYearTo(getParam('yearTo'))
    setSortBy(getParam('sortBy') || 'title')
    setSortOrder(getParam('sortOrder') || 'asc')
  }, [searchParams])

  const hasFilters = selectedGenres.length > 0 || selectedTags.length > 0 ||
    selectedAuthors.length > 0 || selectedType || selectedStatus ||
    selectedTranslationStatus || yearFrom || yearTo || search

  const applyFilters = () => {
    const params = new URLSearchParams()

    if (search) params.set('search', search)
    if (selectedGenres.length) params.set('genres', selectedGenres.join(','))
    if (selectedTags.length) params.set('tags', selectedTags.join(','))
    if (selectedAuthors.length) params.set('authors', selectedAuthors.join(','))
    if (selectedType) params.set('type', selectedType)
    if (selectedStatus) params.set('status', selectedStatus)
    if (selectedTranslationStatus) params.set('translationStatus', selectedTranslationStatus)
    if (yearFrom) params.set('yearFrom', yearFrom)
    if (yearTo) params.set('yearTo', yearTo)
    if (sortBy !== 'title') params.set('sortBy', sortBy)
    if (sortOrder !== 'asc') params.set('sortOrder', sortOrder)

    const query = params.toString()
    router.push(`/catalog${query ? `?${query}` : ''}`)
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedGenres([])
    setSelectedTags([])
    setSelectedAuthors([])
    setSelectedType('')
    setSelectedStatus('')
    setSelectedTranslationStatus('')
    setYearFrom('')
    setYearTo('')
    setSortBy('title')
    setSortOrder('asc')
    router.push('/catalog')
  }

  useEffect(() => {
    const params = new URLSearchParams()
    const currentSearch = searchParams.get('search') || ''
    const currentGenres = searchParams.get('genres') || ''
    const currentTags = searchParams.get('tags') || ''
    const currentAuthors = searchParams.get('authors') || ''
    const currentType = searchParams.get('type') || ''
    const currentStatus = searchParams.get('status') || ''
    const currentTranslationStatus = searchParams.get('translationStatus') || ''
    const currentYearFrom = searchParams.get('yearFrom') || ''
    const currentYearTo = searchParams.get('yearTo') || ''
    const currentSortBy = searchParams.get('sortBy') || 'title'
    const currentSortOrder = searchParams.get('sortOrder') || 'asc'

    // Skip if already matches (prevent infinite loop)
    if (
      search === currentSearch &&
      selectedGenres.join(',') === currentGenres &&
      selectedTags.join(',') === currentTags &&
      selectedAuthors.join(',') === currentAuthors &&
      selectedType === currentType &&
      selectedStatus === currentStatus &&
      selectedTranslationStatus === currentTranslationStatus &&
      yearFrom === currentYearFrom &&
      yearTo === currentYearTo &&
      sortBy === currentSortBy &&
      sortOrder === currentSortOrder
    ) {
      return
    }

    const timeoutId = setTimeout(() => {
      applyFilters()
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [search, selectedGenres, selectedTags, selectedAuthors, selectedType, selectedStatus, selectedTranslationStatus, yearFrom, yearTo, sortBy, sortOrder])

  const toggleGenre = (slug: string) => {
    setSelectedGenres(prev =>
      prev.includes(slug) ? prev.filter(g => g !== slug) : [...prev, slug]
    )
  }

  const toggleTag = (slug: string) => {
    setSelectedTags(prev =>
      prev.includes(slug) ? prev.filter(t => t !== slug) : [...prev, slug]
    )
  }

  const toggleAuthor = (slug: string) => {
    setSelectedAuthors(prev =>
      prev.includes(slug) ? prev.filter(a => a !== slug) : [...prev, slug]
    )
  }

  return (
    <div className={variant === 'sidebar' ? 'space-y-5 rounded-md border bg-card p-4' : 'space-y-4'}>
      {/* Search and Quick Filters */}
      <div className={variant === 'sidebar' ? 'flex flex-col gap-3' : 'flex flex-wrap gap-3'}>
        <Input
          placeholder="Пошук новели..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={variant === 'sidebar' ? 'w-full' : 'max-w-xs'}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Фільтри
              {hasFilters && (
                <Badge variant="secondary" className="ml-1">
                  {selectedGenres.length + selectedTags.length + (selectedType ? 1 : 0) + (selectedStatus ? 1 : 0)}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 max-h-[80vh] overflow-y-auto">
            {/* Type */}
            <DropdownMenuLabel>Тип</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {typeOptions.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={selectedType === option.value}
                onCheckedChange={() => setSelectedType(selectedType === option.value ? '' : option.value)}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}

            <DropdownMenuSeparator />

            {/* Status */}
            <DropdownMenuLabel>Статус тайтлу</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {statusOptions.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={selectedStatus === option.value}
                onCheckedChange={() => setSelectedStatus(selectedStatus === option.value ? '' : option.value)}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}

            <DropdownMenuSeparator />

            {/* Translation Status */}
            <DropdownMenuLabel>Статус перекладу</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {translationStatusOptions.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={selectedTranslationStatus === option.value}
                onCheckedChange={() => setSelectedTranslationStatus(selectedTranslationStatus === option.value ? '' : option.value)}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}

            <DropdownMenuSeparator />

            {/* Year Range */}
            <DropdownMenuLabel>Рік випуску</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="flex gap-2 p-2">
              <Input
                placeholder="Від"
                type="number"
                value={yearFrom}
                onChange={(e) => setYearFrom(e.target.value)}
                className="w-20"
              />
              <Input
                placeholder="До"
                type="number"
                value={yearTo}
                onChange={(e) => setYearTo(e.target.value)}
                className="w-20"
              />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              Сортування: {sortOptions.find(o => o.value === sortBy)?.label}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {sortOptions.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={sortBy === option.value}
                onCheckedChange={() => setSortBy(option.value)}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={sortOrder === 'asc'}
              onCheckedChange={() => setSortOrder('asc')}
            >
              За зростанням
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={sortOrder === 'desc'}
              onCheckedChange={() => setSortOrder('desc')}
            >
              За спаданням
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {hasFilters && (
          <Button variant="ghost" onClick={clearFilters} className="gap-2">
            <X className="h-4 w-4" />
            Очистити
          </Button>
        )}
      </div>

      {/* Expanded Filters (Genres, Tags, Authors) */}
      {(isExpanded || variant === 'sidebar') && (
        <div className={variant === 'sidebar' ? 'space-y-4' : 'grid gap-4 md:grid-cols-3'}>
          {/* Genres */}
          <div>
            <h3 className="mb-2 text-sm font-medium">Жанри</h3>
            <div className="flex flex-wrap gap-1">
              {genres.map((genre) => (
                <Badge
                  key={genre.slug}
                  variant={selectedGenres.includes(genre.slug) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleGenre(genre.slug)}
                >
                  {genre.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <h3 className="mb-2 text-sm font-medium">Теги</h3>
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <Badge
                  key={tag.slug}
                  variant={selectedTags.includes(tag.slug) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag.slug)}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Authors */}
          <div>
            <h3 className="mb-2 text-sm font-medium">Автори</h3>
            <div className="flex flex-wrap gap-1">
              {authors.map((author) => (
                <Badge
                  key={author.slug}
                  variant={selectedAuthors.includes(author.slug) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleAuthor(author.slug)}
                >
                  {author.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {variant === 'toolbar' && (
        <Button
          variant="link"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-0"
        >
          {isExpanded ? 'Сховати додаткові фільтри' : 'Показати жанри, теги, авторів'}
        </Button>
      )}

      {/* Active Filters */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2">
          {selectedGenres.map((slug) => {
            const genre = genres.find(g => g.slug === slug)
            return genre && (
              <Badge key={slug} variant="secondary" className="gap-1 cursor-pointer" onClick={() => toggleGenre(slug)}>
                {genre.name}
                <X className="h-3 w-3" />
              </Badge>
            )
          })}
          {selectedTags.map((slug) => {
            const tag = tags.find(t => t.slug === slug)
            return tag && (
              <Badge key={slug} variant="secondary" className="gap-1 cursor-pointer" onClick={() => toggleTag(slug)}>
                {tag.name}
                <X className="h-3 w-3" />
              </Badge>
            )
          })}
          {selectedAuthors.map((slug) => {
            const author = authors.find(a => a.slug === slug)
            return author && (
              <Badge key={slug} variant="secondary" className="gap-1 cursor-pointer" onClick={() => toggleAuthor(slug)}>
                {author.name}
                <X className="h-3 w-3" />
              </Badge>
            )
          })}
          {selectedType && (
            <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setSelectedType('')}>
              {typeOptions.find(t => t.value === selectedType)?.label}
              <X className="h-3 w-3" />
            </Badge>
          )}
          {selectedStatus && (
            <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setSelectedStatus('')}>
              {statusOptions.find(s => s.value === selectedStatus)?.label}
              <X className="h-3 w-3" />
            </Badge>
          )}
          {selectedTranslationStatus && (
            <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setSelectedTranslationStatus('')}>
              {translationStatusOptions.find(t => t.value === selectedTranslationStatus)?.label}
              <X className="h-3 w-3" />
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
