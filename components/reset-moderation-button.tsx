'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'

interface ResetModerationProps {
  novelSlug: string
  novelTitle: string
}

export default function ResetModeration({ novelSlug, novelTitle }: ResetModerationProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleReset = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/novels/${novelSlug}/reset-moderation`, {
        method: 'POST',
      })
      if (res.ok) {
        setOpen(false)
        router.refresh()
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <RotateCcw className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Повернути на модерацію</DialogTitle>
            <DialogDescription>
              Тайтл &quot;{novelTitle}&quot; буде повернено на модерацію. Ви впевнені?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Скасувати
            </Button>
            <Button variant="default" onClick={handleReset} disabled={isLoading}>
              {isLoading ? 'Зачекайте...' : 'Повернути'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
