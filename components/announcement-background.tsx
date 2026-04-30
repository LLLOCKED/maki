'use client'

import { useState, useEffect } from 'react'
import { safeFetchJson } from '@/lib/fetch-json'

interface Announcement {
  id: string
  title: string
  posterUrl: string | null
}

export default function AnnouncementBackground() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    safeFetchJson<Announcement[]>('/api/announcements')
      .then((data: Announcement[]) => {
        if (data.length > 0) {
          setAnnouncement(data[0])
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!announcement) return
    const interval = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        safeFetchJson<Announcement[]>('/api/announcements')
          .then((data: Announcement[]) => {
            if (data.length > 0) {
              const nextIndex = (index + 1) % data.length
              setIndex(nextIndex)
              setAnnouncement(data[nextIndex])
            }
          })
          .catch(() => {})
        setIsTransitioning(false)
      }, 300)
    }, 5000)
    return () => clearInterval(interval)
  }, [announcement, index])

  if (!announcement?.posterUrl) return null

  return (
    <div className="absolute inset-x-0 top-0 -z-10 h-4/5">
      <img
        src={announcement.posterUrl}
        alt=""
        className={`w-full h-full object-cover object-center scale-105 blur-md transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
        style={{ maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)', WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)' }}
      />
    </div>
  )
}
