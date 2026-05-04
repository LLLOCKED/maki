import type React from 'react'
import SafeMarkdown from '@/components/safe-markdown'

interface CommentContentProps {
  content: string
  className?: string
}

function renderInlineFormatting(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  const pattern = /(\[u\]([\s\S]+?)\[\/u\])/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <SafeMarkdown key={`md-${lastIndex}`} breaks>
          {text.slice(lastIndex, match.index)}
        </SafeMarkdown>
      )
    }
    nodes.push(
      <span key={`u-${match.index}`} className="underline underline-offset-2">
        {match[2]}
      </span>
    )
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    nodes.push(
      <SafeMarkdown key={`md-${lastIndex}`} breaks>
        {text.slice(lastIndex)}
      </SafeMarkdown>
    )
  }

  return nodes
}

export default function CommentContent({ content, className = '' }: CommentContentProps) {
  const parts = content.split(/(\|\|[\s\S]+?\|\|)/g).filter(Boolean)

  return (
    <div className={`comment-content prose prose-sm max-w-none dark:prose-invert ${className}`}>
      {parts.map((part, index) => {
        if (part.startsWith('||') && part.endsWith('||')) {
          const spoiler = part.slice(2, -2)

          return (
            <details key={`${part}-${index}`} className="my-1 rounded-md border bg-muted/40 px-3 py-2">
              <summary className="cursor-pointer text-sm font-medium">Спойлер</summary>
              <div className="mt-2">
                {renderInlineFormatting(spoiler)}
              </div>
            </details>
          )
        }

        return (
          <div key={`${part}-${index}`}>
            {renderInlineFormatting(part)}
          </div>
        )
      })}
    </div>
  )
}
