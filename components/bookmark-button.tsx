'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface BookmarkButtonProps {
  novelId: string
  initialStatus?: string | null
}

const statusLabels: Record<string, string> = {
  reading: 'Читаю',
  planned: 'В планах',
  completed: 'Прочитано',
  dropped: 'Залишено',
}

const statusColors: Record<string, string> = {
  reading: 'text-blue-500',
  planned: 'text-yellow-500',
  completed: 'text-green-500',
  dropped: 'text-red-500',
}

export default function BookmarkButton({ novelId, initialStatus }: BookmarkButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(initialStatus || null)
  const [isOpen, setIsOpen] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novelId, status: newStatus }),
      })

      if (res.ok) {
        setCurrentStatus(newStatus)
        setIsOpen(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Bookmark error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/bookmarks?novelId=${novelId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setCurrentStatus(null)
        setIsOpen(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Remove bookmark error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={isLoading}>
          <Bookmark className={`h-4 w-4 ${currentStatus ? statusColors[currentStatus] : ''}`} />
          {currentStatus ? statusLabels[currentStatus] : 'До закладок'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleStatusChange('reading')}>
          <span className={`mr-2 ${statusColors.reading}`}>●</span>
          {statusLabels.reading}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusChange('planned')}>
          <span className={`mr-2 ${statusColors.planned}`}>●</span>
          {statusLabels.planned}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
          <span className={`mr-2 ${statusColors.completed}`}>●</span>
          {statusLabels.completed}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusChange('dropped')}>
          <span className={`mr-2 ${statusColors.dropped}`}>●</span>
          {statusLabels.dropped}
        </DropdownMenuItem>
        {currentStatus && (
          <>
            <DropdownMenuItem onClick={handleRemove} className="text-destructive">
              Видалити з закладок
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
