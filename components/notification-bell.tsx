'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { safeFetchJson } from '@/lib/fetch-json'

export default function NotificationBell() {
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    safeFetchJson<{ count?: number }>('/api/notifications/count')
      .then(data => {
        setCount(data.count || 0)
        setIsLoading(false)
      })
      .catch(() => {
        setIsLoading(false)
      })
  }, [])

  if (isLoading) {
    return (
      <Link href="/notifications" className="relative p-2 hover:bg-muted rounded-md">
        <Bell className="h-5 w-5" />
      </Link>
    )
  }

  return (
    <Link href="/notifications" className="relative p-2 hover:bg-muted rounded-md">
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-medium rounded-full h-4 w-4 flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}
