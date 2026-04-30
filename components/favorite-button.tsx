'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FavoriteButtonProps {
  novelId: string
  initialIsFavorited?: boolean
}

export default function FavoriteButton({ novelId, initialIsFavorited = false }: FavoriteButtonProps) {
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
        if (res.ok) {
          setIsFavorited(false)
          router.refresh()
        }
      } else {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ novelId }),
        })
        if (res.ok) {
          setIsFavorited(true)
          router.refresh()
        }
      }
    } catch (error) {
      console.error('Favorite error:', error)
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
      className="gap-2"
    >
      <Bell className={`h-4 w-4 ${isFavorited ? 'fill-primary text-primary' : ''}`} />
      {isFavorited ? 'Стежите' : 'Стежити'}
    </Button>
  )
}
