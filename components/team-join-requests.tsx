'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Check, X } from 'lucide-react'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface JoinRequest {
  id: string
  createdAt: Date | string
  user: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  }
}

interface TeamJoinRequestsProps {
  teamSlug: string
  requests: JoinRequest[]
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json()
    return data.error || fallback
  } catch {
    return fallback
  }
}

export default function TeamJoinRequests({ teamSlug, requests }: TeamJoinRequestsProps) {
  const router = useRouter()
  const [processingId, setProcessingId] = useState<string | null>(null)

  if (requests.length === 0) {
    return null
  }

  const handleRequest = async (requestId: string, action: 'approve' | 'reject') => {
    setProcessingId(requestId)
    try {
      const res = await fetch(`/api/teams/${teamSlug}/join-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!res.ok) {
        toast.error(await readErrorMessage(res, 'Не вдалось обробити заявку'))
        return
      }

      toast.success(action === 'approve' ? 'Заявку прийнято' : 'Заявку відхилено')
      router.refresh()
    } catch (error) {
      console.error('Handle join request error:', error)
      toast.error('Не вдалось обробити заявку')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Заявки на вступ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.map((request) => (
          <div key={request.id} className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href={`/user/${request.user.id}`} className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                {request.user.image ? (
                  <Image src={request.user.image} alt={request.user.name || ''} width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <span className="font-medium">{request.user.name?.[0] || request.user.email?.[0] || '?'}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium">{request.user.name || 'Користувач'}</p>
                {request.user.email && (
                  <p className="truncate text-xs text-muted-foreground">{request.user.email}</p>
                )}
              </div>
            </Link>
            <div className="flex gap-2 sm:justify-end">
              <Button
                size="sm"
                onClick={() => handleRequest(request.id, 'approve')}
                disabled={processingId === request.id}
              >
                <Check className="mr-2 h-4 w-4" />
                Прийняти
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRequest(request.id, 'reject')}
                disabled={processingId === request.id}
              >
                <X className="mr-2 h-4 w-4" />
                Відхилити
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
