'use client'

import { useState } from 'react'
import { Flag } from 'lucide-react'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ReportButtonProps {
  targetType: 'NOVEL' | 'CHAPTER' | 'COMMENT' | 'FORUM_COMMENT'
  novelId?: string
  chapterId?: string
  commentId?: string
  forumCommentId?: string
  label?: string
  iconOnly?: boolean
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json()
    return data.error || fallback
  } catch {
    return fallback
  }
}

export default function ReportButton({
  targetType,
  novelId,
  chapterId,
  commentId,
  forumCommentId,
  label = 'Поскаржитись',
  iconOnly = true,
}: ReportButtonProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit() {
    if (reason.trim().length < 3) {
      toast.error('Вкажіть коротку причину скарги')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          novelId,
          chapterId,
          commentId,
          forumCommentId,
          reason,
          details,
        }),
      })

      if (!res.ok) {
        toast.error(await readErrorMessage(res, 'Не вдалось надіслати скаргу'))
        return
      }

      toast.success('Скаргу надіслано на розгляд')
      setOpen(false)
      setReason('')
      setDetails('')
    } catch (error) {
      console.error('Report error:', error)
      toast.error('Не вдалось надіслати скаргу')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={iconOnly ? 'h-9 w-9 shrink-0 p-0' : 'gap-2'}
        title={label}
        aria-label={label}
        onClick={() => setOpen(true)}
      >
        <Flag className="h-4 w-4" />
        {!iconOnly && label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Причина</label>
              <Input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={120}
                placeholder="Наприклад: помилка, порушення правил, некоректний контент"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Деталі</label>
              <Textarea
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                maxLength={2000}
                rows={4}
                placeholder="Опишіть проблему детальніше"
              />
              <p className="mt-1 text-xs text-muted-foreground">{details.length}/2000</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Скасувати
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={isSubmitting || reason.trim().length < 3}>
              {isSubmitting ? 'Надсилання...' : 'Надіслати'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
