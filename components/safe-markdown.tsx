import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'

const markdownSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    img: [
      ...(defaultSchema.attributes?.img || []),
      'src',
      'alt',
      'title',
      'width',
      'height',
    ],
  },
}

type SafeMarkdownProps = {
  children: string
  breaks?: boolean
}

export default function SafeMarkdown({ children, breaks = false }: SafeMarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={breaks ? [remarkGfm, remarkBreaks] : [remarkGfm]}
      rehypePlugins={[[rehypeSanitize, markdownSchema]]}
      components={{
        img: ({ src, alt, title }) => (
          <img
            src={src || ''}
            alt={alt || ''}
            title={title}
            loading="lazy"
          />
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  )
}
