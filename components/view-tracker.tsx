'use client'

import { useEffect, useRef } from 'react'

interface ViewTrackerProps {
  slug: string
}

export default function ViewTracker({ slug }: ViewTrackerProps) {
  const hasTracked = useRef(false)

  useEffect(() => {
    if (hasTracked.current) return
    hasTracked.current = true

    fetch(`/api/novels/${slug}/view`, { method: 'POST' }).catch(console.error)
  }, [slug])

  return null
}
