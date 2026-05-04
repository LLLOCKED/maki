import { cn } from '@/lib/utils'

const ONLINE_WINDOW_MS = 5 * 60 * 1000

interface UserPresenceProps {
  lastSeen?: Date | string | null
  className?: string
  compact?: boolean
}

function getLastSeenDate(lastSeen?: Date | string | null): Date | null {
  if (!lastSeen) return null
  const date = new Date(lastSeen)
  return Number.isNaN(date.getTime()) ? null : date
}

export function isUserOnline(lastSeen?: Date | string | null): boolean {
  const date = getLastSeenDate(lastSeen)
  if (!date) return false
  return Date.now() - date.getTime() <= ONLINE_WINDOW_MS
}

function formatLastSeen(lastSeen?: Date | string | null): string {
  const date = getLastSeenDate(lastSeen)
  if (!date) return 'Активність невідома'

  const diffMs = Date.now() - date.getTime()
  const minutes = Math.max(0, Math.floor(diffMs / (1000 * 60)))
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 5) return 'Онлайн'
  if (minutes < 60) return `Був(ла) ${minutes} хв тому`
  if (hours < 24) return `Був(ла) ${hours} год тому`
  if (days < 7) return `Був(ла) ${days} дн тому`

  return `Був(ла) ${date.toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  })}`
}

export function OnlineDot({ lastSeen, className }: UserPresenceProps) {
  const online = isUserOnline(lastSeen)

  return (
    <span
      className={cn(
        'inline-block h-2.5 w-2.5 rounded-full border border-background',
        online ? 'bg-green-500' : 'bg-muted-foreground/40',
        className
      )}
      title={online ? 'Онлайн' : formatLastSeen(lastSeen)}
      aria-label={online ? 'Онлайн' : formatLastSeen(lastSeen)}
    />
  )
}

export default function UserPresence({ lastSeen, className, compact = false }: UserPresenceProps) {
  const online = isUserOnline(lastSeen)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs',
        online ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground',
        className
      )}
      suppressHydrationWarning
    >
      <OnlineDot lastSeen={lastSeen} className="h-2 w-2 border-0" />
      {compact && online ? 'Онлайн' : formatLastSeen(lastSeen)}
    </span>
  )
}
