'use client'

import { useEffect } from 'react'

export default function Heartbeat() {
  useEffect(() => {
    // Update lastSeen on mount
    const updateHeartbeat = async () => {
      try {
        await fetch('/api/heartbeat', { method: 'POST' })
      } catch (error) {
        console.error('Heartbeat error:', error)
      }
    }

    updateHeartbeat()

    // Update every 4 minutes (5 min threshold in admin page)
    const interval = setInterval(updateHeartbeat, 4 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return null
}