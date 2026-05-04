'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UserPlus, Check } from 'lucide-react'
import { toast } from 'react-toastify'

interface JoinTeamButtonProps {
  teamSlug: string
  initialHasPendingRequest?: boolean
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json()
    return data.error || fallback
  } catch {
    return fallback
  }
}

export default function JoinTeamButton({ teamSlug, initialHasPendingRequest = false }: JoinTeamButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [hasPendingRequest, setHasPendingRequest] = useState(initialHasPendingRequest)

  const handleJoin = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/teams/${teamSlug}/join`, {
        method: 'POST',
      })
      if (!res.ok) {
        toast.error(await readErrorMessage(res, 'Не вдалось надіслати заявку'))
        return
      }

      setHasPendingRequest(true)
      toast.success('Заявку на вступ надіслано')
    } catch (error) {
      console.error('Join team error:', error)
      toast.error('Не вдалось надіслати заявку')
    } finally {
      setIsLoading(false)
    }
  }

  if (hasPendingRequest) {
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
