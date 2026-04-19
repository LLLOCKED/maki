'use client'

import { Button } from '@/components/ui/button'
import { Bold, Italic, Strikethrough, Heading1, Heading2, Heading3, Quote, Code, Link as LinkIcon, List, ListOrdered } from 'lucide-react'

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  value: string
  onChange: (value: string) => void
}

export default function MarkdownToolbar({ textareaRef, value, onChange }: MarkdownToolbarProps) {
  const insertText = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end) || placeholder

    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end)
    onChange(newText)

    // Set cursor position after the inserted text
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + before.length + selectedText.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const buttons = [
    {
      icon: <Bold className="h-4 w-4" />,
      label: 'Bold',
      action: () => insertText('**', '**', 'bold text'),
    },
    {
      icon: <Italic className="h-4 w-4" />,
      label: 'Italic',
      action: () => insertText('*', '*', 'italic text'),
    },
    {
      icon: <Strikethrough className="h-4 w-4" />,
      label: 'Strikethrough',
      action: () => insertText('~~', '~~', 'strikethrough text'),
    },
    {
      icon: <Heading1 className="h-4 w-4" />,
      label: 'Heading 1',
      action: () => insertText('# ', '', 'Heading'),
    },
    {
      icon: <Heading2 className="h-4 w-4" />,
      label: 'Heading 2',
      action: () => insertText('## ', '', 'Heading'),
    },
    {
      icon: <Heading3 className="h-4 w-4" />,
      label: 'Heading 3',
      action: () => insertText('### ', '', 'Heading'),
    },
    {
      icon: <Quote className="h-4 w-4" />,
      label: 'Quote',
      action: () => insertText('> ', '', 'quote'),
    },
    {
      icon: <Code className="h-4 w-4" />,
      label: 'Code',
      action: () => insertText('`', '`', 'code'),
    },
    {
      icon: <LinkIcon className="h-4 w-4" />,
      label: 'Link',
      action: () => insertText('[', '](url)', 'link text'),
    },
    {
      icon: <List className="h-4 w-4" />,
      label: 'Bullet List',
      action: () => insertText('- ', '', 'list item'),
    },
    {
      icon: <ListOrdered className="h-4 w-4" />,
      label: 'Numbered List',
      action: () => insertText('1. ', '', 'list item'),
    },
  ]

  return (
    <div className="flex flex-wrap gap-1 border-b p-2">
      {buttons.map((button, index) => (
        <Button
          key={index}
          type="button"
          variant="ghost"
          size="sm"
          onClick={button.action}
          title={button.label}
          className="h-8 w-8 p-0"
        >
          {button.icon}
        </Button>
      ))}
    </div>
  )
}
