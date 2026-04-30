'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { safeFetchJson } from '@/lib/fetch-json'

interface Announcement {
  id: string
  title: string
  description: string | null
  posterUrl: string | null
  linkUrl: string
  linkType: string
  tag: string
}

const tagLabels: Record<string, { label: string; color: string }> = {
  news: { label: 'Новина', color: 'bg-blue-500' },
  popular: { label: 'Популярне', color: 'bg-green-500' },
  attention: { label: 'Увага', color: 'bg-red-500' },
  new: { label: 'Нове', color: 'bg-purple-500' },
  featured: { label: 'Рекомендація', color: 'bg-yellow-500' },
}

export default function AnnouncementCarousel() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [current, setCurrent] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    safeFetchJson<Announcement[]>('/api/announcements')
      .then((data) => {
        setAnnouncements(data)
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [])

  const goTo = useCallback((index: number) => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrent(index)
      setIsTransitioning(false)
    }, 300)
  }, [])

  const next = useCallback(() => {
    goTo((current + 1) % announcements.length)
  }, [current, announcements.length, goTo])

  useEffect(() => {
    if (announcements.length === 0) return
    const interval = setInterval(next, 5000)
    return () => clearInterval(interval)
  }, [announcements.length, next])

  if (isLoading || announcements.length === 0) {
    return null
  }

  const item = announcements[current]
  const tagInfo = tagLabels[item.tag] || { label: item.tag, color: 'bg-gray-500' }

  const Wrapper = item.linkType === 'external' ? 'a' : Link
  const wrapperProps = item.linkType === 'external'
    ? { href: item.linkUrl, target: '_blank', rel: 'noopener noreferrer' }
    : { href: item.linkUrl }

  return (
    <div className="relative w-full h-80 md:h-96 overflow-hidden">
      {/* Clickable Background Image */}
      <Wrapper {...wrapperProps} className="block absolute inset-0 cursor-pointer">
        {item.posterUrl && (
          <img
            src={item.posterUrl}
            alt={item.title}
            className={`w-full h-full object-cover transition-opacity duration-300 ${isTransitioning ? 'opacity-20' : 'opacity-100'}`}
            style={{ maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 50%, rgba(0,0,0,0.1) 100%)', WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 50%, rgba(0,0,0,0.1) 100%)' }}
          />
        )}
        {/* Centered Content Overlay */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center p-8 transition-opacity duration-300 ${isTransitioning ? 'opacity-20' : 'opacity-100'}`}>
          <span className={`inline-block w-fit px-3 py-1 text-sm text-white rounded ${tagInfo.color} mb-3`}>
            {tagInfo.label}
          </span>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 text-center max-w-2xl">{item.title}</h3>
          {item.description && (
            <p className="text-base text-gray-200 text-center line-clamp-2 max-w-xl">{item.description}</p>
          )}
        </div>
      </Wrapper>

      {/* Dots Navigation */}
      {announcements.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {announcements.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation()
                goTo(index)
              }}
              className={`w-2 h-2 rounded-full transition-colors ${index === current ? 'bg-white' : 'bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
