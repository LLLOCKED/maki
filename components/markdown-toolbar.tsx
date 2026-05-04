'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Bold, Italic, Strikethrough, Heading1, Heading2, Heading3, Quote, Code, Link as LinkIcon, List, ListOrdered, Image as ImageIcon, Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  value: string
  onChange: (value: string) => void
  uploadImage?: (file: File) => Promise<string>
}

export default function MarkdownToolbar({ textareaRef, value, onChange, uploadImage }: MarkdownToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

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

  const insertRawText = (text: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const prefix = value.substring(0, start)
    const suffix = value.substring(end)
    const needsPrefixBreak = prefix.length > 0 && !prefix.endsWith('\n\n')
    const needsSuffixBreak = suffix.length > 0 && !suffix.startsWith('\n\n')
    const insertion = `${needsPrefixBreak ? '\n\n' : ''}${text}${needsSuffixBreak ? '\n\n' : ''}`
    const newText = prefix + insertion + suffix
    onChange(newText)

    setTimeout(() => {
      textarea.focus()
      const cursorPos = start + insertion.length
      textarea.setSelectionRange(cursorPos, cursorPos)
    }, 0)
  }

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !uploadImage) return

    setIsUploadingImage(true)
    try {
      const url = await uploadImage(file)
      const alt = file.name.replace(/\.[^.]+$/, '').trim() || 'зображення'
      insertRawText(`![${alt}](${url})`)
      toast.success('Зображення додано в розділ')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не вдалось завантажити зображення')
    } finally {
      setIsUploadingImage(false)
    }
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
      {uploadImage && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleImageChange}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            title="Додати зображення"
            className="h-8 w-8 p-0"
            disabled={isUploadingImage}
          >
            {isUploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
          </Button>
        </>
      )}
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
