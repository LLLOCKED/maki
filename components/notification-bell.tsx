'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { safeFetchJson } from '@/lib/fetch-json'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export default function NotificationBell() {
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio('/static/notification.mp3')

    const fetchCount = async () => {
      try {
        const data = await safeFetchJson<{ count?: number }>('/api/notifications/count')
        const newCount = data.count || 0
        
        // Play sound if count increased
        if (newCount > count && audioRef.current) {
          audioRef.current.play().catch(() => {}) // Ignore auto-play blocking errors
        }
        
        setCount(newCount)
        setIsLoading(false)
      } catch (error) {
        setIsLoading(false)
      }
    }

    fetchCount()
    const interval = setInterval(fetchCount, 30000) // Poll every 30 seconds

    window.addEventListener('notificationsRead', fetchCount)

    return () => {
      clearInterval(interval)
      window.removeEventListener('notificationsRead', fetchCount)
    }
  }, [count])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href="/notifications" className="relative p-2 hover:bg-muted rounded-md">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-medium rounded-full h-4 w-4 flex items-center justify-center">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        <p>Сповіщення {count > 0 ? `(${count})` : ''}</p>
      </TooltipContent>
    </Tooltip>
  )
}
