'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface ExplicitContentDialogProps {
  novelId: string
  novelTitle: string
}

export default function ExplicitContentDialog({ novelId, novelTitle }: ExplicitContentDialogProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Check if user already confirmed 18+ for this novel
    const confirmed = localStorage.getItem(`explicit_${novelId}`)
    if (!confirmed) {
      setIsOpen(true)
    }
  }, [novelId])

  const handleConfirm = () => {
    localStorage.setItem(`explicit_${novelId}`, 'true')
    setIsOpen(false)
  }

  const handleCancel = () => {
    setIsOpen(false)
    window.history.back()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen} preventClose>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <DialogTitle className="text-xl">Попередження про вміст</DialogTitle>
          <DialogDescription className="text-center">
            <strong>&quot;{novelTitle}&quot;</strong> містить контент для дорослих (18+).
            <br /><br />
            Цей твір може містити відверті сексуальні сцени, насилля або інший контент, непридатний для неповнолітніх.
            <br /><br />
            Підтвердіть, що вам виповнилося 18 років.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleCancel} className="flex-1">
            Мені немає 18
          </Button>
          <Button onClick={handleConfirm} className="flex-1 bg-red-600 hover:bg-red-700">
            Мені є 18
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
