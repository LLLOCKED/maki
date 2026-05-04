'use client'

import { RefObject } from 'react'
import { Bold, EyeOff, Italic, Strikethrough, Underline } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CommentFormatToolbarProps {
  textareaRef: RefObject<HTMLTextAreaElement>
  value: string
  onChange: (value: string) => void
}

const tools = [
  { label: 'Жирний', icon: Bold, before: '**', after: '**', placeholder: 'жирний текст' },
  { label: 'Курсив', icon: Italic, before: '*', after: '*', placeholder: 'курсив' },
  { label: 'Підкреслений', icon: Underline, before: '[u]', after: '[/u]', placeholder: 'підкреслений текст' },
  { label: 'Закреслений', icon: Strikethrough, before: '~~', after: '~~', placeholder: 'закреслений текст' },
  { label: 'Спойлер', icon: EyeOff, before: '||', after: '||', placeholder: 'спойлер' },
]

export default function CommentFormatToolbar({
  textareaRef,
  value,
  onChange,
}: CommentFormatToolbarProps) {
  const applyFormat = (before: string, after: string, placeholder: string) => {
    const textarea = textareaRef.current
    if (!textarea) {
      onChange(`${value}${before}${placeholder}${after}`)
      return
    }

    const selectionStart = textarea.selectionStart
    const selectionEnd = textarea.selectionEnd
    const selectedText = value.slice(selectionStart, selectionEnd)
    const innerText = selectedText || placeholder
    const nextValue = `${value.slice(0, selectionStart)}${before}${innerText}${after}${value.slice(selectionEnd)}`
    const nextSelectionStart = selectionStart + before.length
    const nextSelectionEnd = nextSelectionStart + innerText.length

    onChange(nextValue)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(nextSelectionStart, nextSelectionEnd)
    })
  }

  return (
    <div className="mb-2 flex flex-wrap gap-1 rounded-md border bg-muted/30 p-1">
      {tools.map((tool) => {
        const Icon = tool.icon

        return (
          <Button
            key={tool.label}
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title={tool.label}
            aria-label={tool.label}
            onClick={() => applyFormat(tool.before, tool.after, tool.placeholder)}
          >
            <Icon className="h-4 w-4" />
          </Button>
        )
      })}
    </div>
  )
}
