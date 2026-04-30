import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'

type SafeMarkdownProps = {
  children: string
  breaks?: boolean
}

export default function SafeMarkdown({ children, breaks = false }: SafeMarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={breaks ? [remarkGfm, remarkBreaks] : [remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
    >
      {children}
    </ReactMarkdown>
  )
}
