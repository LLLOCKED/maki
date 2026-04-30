'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface LeaveTeamButtonProps {
  teamSlug: string
  teamName: string
  isOwner: boolean
}

export default function LeaveTeamButton({ teamSlug, teamName, isOwner }: LeaveTeamButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleLeave = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/teams/${teamSlug}/leave`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Не вдалось вийти з команди')
        return
      }

      toast.success('Ви вийшли з команди')
      setIsOpen(false)
    } catch (error) {
      toast.error('Не вдалось вийти з команди')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        className="gap-2 text-destructive hover:text-destructive"
        onClick={() => setIsOpen(true)}
      >
        Вийти з команди
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Вийти з команди?</DialogTitle>
            <DialogDescription className="text-base whitespace-pre-line">
              {isOwner ? (
                <>
                  Ви власник команди &quot;{teamName}&quot;.
                  При виході власником стане інший учасник (адмін), якщо такий є.
                  Продовжити?
                </>
              ) : (
                <>Ви впевнені, що хочете вийти з команди &quot;{teamName}&quot;?</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
              Скасувати
            </Button>
            <Button
              variant="destructive"
              onClick={handleLeave}
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isLoading ? 'Виходимо...' : 'Вийти'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
