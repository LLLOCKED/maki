'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, Check, Loader2 } from 'lucide-react'

interface Notification {
  id: string
  type: string
  novelId: string
  chapterId: string
  teamId: string | null
  isRead: boolean
  createdAt: string
  novel: { id: string; title: string; slug: string }
  chapter: { id: string; number: number; volume: number | null }
  team: { id: string; name: string; slug: string } | null
}

interface NotificationsListProps {
  initialNotifications: Notification[]
}

function timeAgo(date: string): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'щойно'
  if (minutes < 60) return `${minutes} хв. тому`
  if (hours < 24) return `${hours} год. тому`
  if (days < 7) return `${days} дн. тому`
  return d.toLocaleDateString('uk-UA')
}

export default function NotificationsList({ initialNotifications }: NotificationsListProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState(initialNotifications)
  const [isLoading, setIsLoading] = useState(false)

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [id] }),
      })
      if (res.ok) {
        setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n))
      }
    } catch (error) {
      console.error('Mark as read error:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
      if (res.ok) {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })))
        router.refresh()
      }
    } catch (error) {
      console.error('Mark all as read error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getChapterUrl = (notification: Notification) => {
    const volStr = notification.chapter.volume ? `${notification.chapter.volume}.` : ''
    const teamPath = notification.team?.slug ? `/${notification.team.slug}` : ''
    return `/read/${notification.novel.slug}/${volStr}${notification.chapter.number}${teamPath}`
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Сповіщення</h2>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={isLoading}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Позначити всі як прочитані
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Bell className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Немає сповіщень</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
                notification.isRead ? 'bg-muted/30' : 'bg-background hover:bg-muted/50'
              }`}
            >
              <Link
                href={getChapterUrl(notification)}
                className="flex-1 space-y-1"
                onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
              >
                <div className="flex items-center gap-2">
                  {!notification.isRead && (
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                  )}
                  <span className="font-medium">{notification.novel.title}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Новий розділ {notification.chapter.volume ? `Том ${notification.chapter.volume} ` : ''}Розділ {notification.chapter.number}
                  {notification.team && ` від ${notification.team.name}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {timeAgo(notification.createdAt)}
                </p>
              </Link>
              {!notification.isRead && (
                <button
                  onClick={() => handleMarkAsRead(notification.id)}
                  className="rounded-md p-2 hover:bg-muted"
                  title="Позначити як прочитане"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}