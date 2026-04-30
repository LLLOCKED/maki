'use client'

import { useRouter } from 'next/navigation'

interface Chapter {
  id: string
  number: number
  volume: number | null
  team: {
    id: string
    name: string
    slug: string
  } | null
}

interface TranslationSelectorProps {
  translations: Chapter[]
  selectedId: string
  novelSlug: string
}

export default function TranslationSelector({
  translations,
  selectedId,
  novelSlug,
}: TranslationSelectorProps) {
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const ch = translations.find(c => c.id === e.target.value)
    if (ch) {
      const volStr = ch.volume ? `${ch.volume}.` : ''
      const teamPath = ch.team?.slug ? `/${ch.team.slug}` : ''
      router.push(`/read/${novelSlug}/${volStr}${ch.number}${teamPath}`)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Переклад:</span>
      <select
        className="rounded-md border bg-background px-2 py-1 text-sm"
        value={selectedId}
        onChange={handleChange}
      >
        {translations.map((ch) => (
          <option key={ch.id} value={ch.id}>
            {ch.team?.name || 'Без команди'}
          </option>
        ))}
      </select>
    </div>
  )
}