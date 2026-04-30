'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TeamFollowButtonProps {
  teamSlug: string
  initialIsFollowing: boolean
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

      if (!response.ok) return

      setIsFollowing(!isFollowing)
      router.refresh()
    } catch (error) {
      console.error('Team follow error:', error)
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
