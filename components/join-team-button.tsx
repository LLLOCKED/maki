'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UserPlus, Check } from 'lucide-react'

interface JoinTeamButtonProps {
  teamId: string
}

export default function JoinTeamButton({ teamId }: JoinTeamButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [joined, setJoined] = useState(false)

  const handleJoin = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/teams/${teamId}/join`, {
        method: 'POST',
      })
      if (res.ok) {
        setJoined(true)
        window.location.reload()
      }
    } catch (error) {
      console.error('Join team error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (joined) {
    return (
      <Button disabled variant="secondary">
        <Check className="mr-2 h-4 w-4" />
        Заявку надіслано
      </Button>
    )
  }

  return (
    <Button onClick={handleJoin} disabled={isLoading}>
      <UserPlus className="mr-2 h-4 w-4" />
      {isLoading ? 'Надсилання...' : 'Вступити до команди'}
    </Button>
  )
}
