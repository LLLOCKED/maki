'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'

interface TeamFollowButtonProps {
  teamSlug: string
  initialIsFollowing: boolean
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json()
    return data.error || fallback
  } catch {
    return fallback
  }
}

export default function TeamFollowButton({ teamSlug, initialIsFollowing }: TeamFollowButtonProps) {
  const router = useRouter()
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/teams/${teamSlug}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST',
      })

      if (!response.ok) {
        toast.error(await readErrorMessage(response, 'Не вдалось оновити стеження'))
        return
      }

      const nextIsFollowing = !isFollowing
      setIsFollowing(nextIsFollowing)
      toast.success(nextIsFollowing ? 'Стеження за командою увімкнено' : 'Стеження за командою вимкнено')
      router.refresh()
    } catch (error) {
      console.error('Team follow error:', error)
      toast.error('Не вдалось оновити стеження')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={isFollowing ? 'secondary' : 'outline'}
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
      className="gap-2"
    >
      <Bell className={`h-4 w-4 ${isFollowing ? 'fill-primary text-primary' : ''}`} />
      {isFollowing ? 'Стежите' : 'Стежити'}
    </Button>
  )
}
