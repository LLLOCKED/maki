'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-toastify'

interface RatingProps {
  novelId: string
  initialRating: number
  userRating?: number
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json()
    return data.error || fallback
  } catch {
    return fallback
  }
}

export default function Rating({ novelId, initialRating, userRating: initialUserRating }: RatingProps) {
  const { data: session } = useSession()
  const [rating, setRating] = useState(initialRating)
  const [userRating, setUserRating] = useState(initialUserRating)
  const [isLoading, setIsLoading] = useState(false)

  const handleRate = async (value: number) => {
    if (!session || isLoading) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novelId, value }),
      })

      if (!res.ok) {
        toast.error(await readErrorMessage(res, 'Не вдалось зберегти оцінку'))
        return
      }

      const data = await res.json()
      setUserRating(value)
      setRating(data.newAverage)
      toast.success('Оцінку збережено')
    } catch (error) {
      console.error('Rating error:', error)
      toast.error('Не вдалось зберегти оцінку')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRate(star)}
            disabled={!session || isLoading}
            className={`transition-colors ${!session ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
          >
            <Star
              className={`h-6 w-6 ${
                star <= (userRating || 0)
                  ? 'fill-yellow-400 text-yellow-400'
                  : star <= rating
                  ? 'fill-yellow-400/50 text-yellow-400/50'
                  : 'text-muted-foreground'
              }`}
            />
          </button>
        ))}
      </div>
      <span className="text-sm text-muted-foreground">
        {rating.toFixed(1)} ({userRating ? 'Ваша оцінка' : 'Голосів'})
      </span>
      {!session && (
        <span className="text-xs text-muted-foreground">(увійдіть щоб оцінити)</span>
      )}
    </div>
  )
}
