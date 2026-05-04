'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, BellRing } from 'lucide-react'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'

interface FavoriteButtonProps {
  novelId: string
  initialIsFavorited?: boolean
  iconOnly?: boolean
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json()
    return data.error || fallback
  } catch {
    return fallback
  }
}

export default function FavoriteButton({ novelId, initialIsFavorited = false, iconOnly = false }: FavoriteButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited)

  const handleToggle = async () => {
    setIsLoading(true)
    try {
      if (isFavorited) {
        const res = await fetch(`/api/favorites?novelId=${novelId}`, {
          method: 'DELETE',
        })
        if (!res.ok) {
          toast.error(await readErrorMessage(res, 'Не вдалось вимкнути стеження'))
          return
        }

        setIsFavorited(false)
        toast.success('Стеження вимкнено')
        router.refresh()
      } else {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ novelId }),
        })
        if (!res.ok) {
          toast.error(await readErrorMessage(res, 'Не вдалось увімкнути стеження'))
          return
        }

        setIsFavorited(true)
        toast.success('Стеження увімкнено')
        router.refresh()
      }
    } catch (error) {
      console.error('Favorite error:', error)
      toast.error('Не вдалось оновити стеження')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
      className={iconOnly ? 'h-9 w-9 shrink-0 p-0' : 'gap-2'}
      aria-label={isFavorited ? 'Вимкнути стеження' : 'Стежити за тайтлом'}
      title={isFavorited ? 'Вимкнути стеження' : 'Стежити за тайтлом'}
    >
      {isFavorited ? (
        <BellRing className="h-4 w-4 text-primary" />
      ) : (
        <Bell className="h-4 w-4" />
      )}
      {!iconOnly && (isFavorited ? 'Стежите' : 'Стежити')}
    </Button>
  )
}
