'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { safeFetchJson } from '@/lib/fetch-json'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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

  const prev = useCallback(() => {
    goTo((current - 1 + announcements.length) % announcements.length)
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
  const getItem = (offset: number) => announcements[(current + offset + announcements.length) % announcements.length]
  const prevItem = getItem(-1)
  const nextItem = getItem(1)
  const tagInfo = tagLabels[item.tag] || { label: item.tag, color: 'bg-gray-500' }

  const Wrapper = item.linkType === 'external' ? 'a' : Link
  const wrapperProps = item.linkType === 'external'
    ? { href: item.linkUrl, target: '_blank', rel: 'noopener noreferrer' }
    : { href: item.linkUrl }

  const renderPeek = (announcement: Announcement, side: 'left' | 'right') => {
    const isLeft = side === 'left'
    const offsetClass = isLeft
      ? 'right-[calc(50%_+_32rem)]'
      : 'left-[calc(50%_+_32rem)]'
    const roundedClass = isLeft ? 'rounded-l-md' : 'rounded-r-md'

    return (
      <button
        key={`${announcement.id}-${side}`}
        type="button"
        onClick={isLeft ? prev : next}
        className={`absolute top-1/2 hidden h-[76%] w-28 -translate-y-1/2 ${offsetClass} overflow-hidden ${roundedClass} bg-muted opacity-65 shadow-sm transition-opacity hover:opacity-90 md:block`}
        aria-label={isLeft ? 'Попередня новина' : 'Наступна новина'}
      >
        {announcement.posterUrl ? (
          <img src={announcement.posterUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
      </button>
    )
  }

  const renderMobilePeek = (announcement: Announcement, side: 'left' | 'right') => {
    const isLeft = side === 'left'

    return (
      <button
        key={`${announcement.id}-${side}-mobile`}
        type="button"
        onClick={isLeft ? prev : next}
        className={`absolute bottom-6 top-6 z-0 w-9 overflow-hidden bg-muted opacity-70 shadow-sm md:hidden ${
          isLeft ? 'left-0 rounded-r-md' : 'right-0 rounded-l-md'
        }`}
        aria-label={isLeft ? 'Попередня новина' : 'Наступна новина'}
      >
        {announcement.posterUrl ? (
          <img src={announcement.posterUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
      </button>
    )
  }

  return (
    <section className="relative overflow-hidden bg-transparent">
      <div className="relative py-4 sm:py-6 md:py-8">
        <div className="relative h-[280px] overflow-hidden sm:h-[340px] md:h-[430px]">
          {announcements.length > 1 && (
            <>
              {renderMobilePeek(prevItem, 'left')}
              {renderMobilePeek(nextItem, 'right')}
              {renderPeek(prevItem, 'left')}
              {renderPeek(nextItem, 'right')}
            </>
          )}

          <Wrapper {...wrapperProps} className="group absolute inset-y-0 left-8 right-8 z-10 mx-auto block max-w-5xl cursor-pointer overflow-hidden rounded-md bg-muted opacity-95 shadow-xl md:left-24 md:right-24 md:shadow-2xl">
            {item.posterUrl ? (
              <img
                src={item.posterUrl}
                alt={item.title}
                className={`h-full w-full object-cover transition duration-500 group-hover:scale-[1.02] ${isTransitioning ? 'opacity-40' : 'opacity-100'}`}
              />
            ) : (
              <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,hsl(var(--accent)),transparent_35%),linear-gradient(135deg,hsl(var(--primary)/0.45),hsl(var(--background)))]" />
            )}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/45 to-transparent md:h-1/2 md:from-black/75 md:via-black/30" />

            <div className={`absolute inset-0 flex items-end transition-opacity duration-300 ${isTransitioning ? 'opacity-30' : 'opacity-100'}`}>
              <div className="max-w-2xl px-4 py-5 text-white sm:px-7 sm:py-7 md:px-12 md:py-10">
                <span className={`mb-2 inline-flex w-fit rounded px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white sm:text-xs md:mb-3 ${tagInfo.color}`}>
                  {tagInfo.label}
                </span>
                <h2 className="line-clamp-2 text-xl font-bold leading-tight sm:text-2xl md:text-4xl">
                  {item.title}
                </h2>
                {item.description && (
                  <p className="mt-2 line-clamp-2 max-w-2xl text-xs leading-5 text-white/90 sm:text-sm md:mt-3 md:text-base md:leading-6">
                    {item.description}
                  </p>
                )}
                <span className="mt-3 inline-flex rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black transition-colors group-hover:bg-white/90 sm:text-sm md:mt-5 md:px-4 md:py-2">
                  Переглянути
                </span>
              </div>
            </div>
          </Wrapper>

          {announcements.length > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault()
                  prev()
                }}
                className="absolute left-1/2 top-1/2 z-20 hidden h-10 w-10 -translate-x-[31.5rem] -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur transition-colors hover:bg-black/55 md:flex"
                aria-label="Попередня новина"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault()
                  next()
                }}
                className="absolute left-1/2 top-1/2 z-20 hidden h-10 w-10 translate-x-[29rem] -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur transition-colors hover:bg-black/55 md:flex"
                aria-label="Наступна новина"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2 rounded-full border bg-background/95 px-3 py-2 shadow-lg md:bottom-10 md:bg-white">
                {announcements.map((announcement, index) => (
                  <button
                    key={announcement.id}
                    type="button"
                    onClick={(event) => {
                      event.preventDefault()
                      goTo(index)
                    }}
                    className={`h-2 rounded-full transition-all ${index === current ? 'w-5 bg-primary' : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60'}`}
                    aria-label={`Новина ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
