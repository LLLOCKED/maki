interface NovelJsonLdProps {
  title: string
  description: string
  slug: string
  coverUrl?: string | null
  authors: string[]
  averageRating?: number
  genres: string[]
}

export function NovelJsonLd({
  title,
  description,
  slug,
  coverUrl,
  authors,
  averageRating,
  genres,
}: NovelJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: title,
    description,
    url: `https://honni.fun/novel/${slug}`,
    ...(coverUrl && coverUrl.startsWith('http') && { image: coverUrl }),
    author: authors.map((name) => ({
      '@type': 'Person',
      name,
    })),
    genre: genres,
    ...(averageRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: averageRating.toFixed(1),
        bestRating: '10',
        worstRating: '1',
        ratingCount: 0,
      },
    }),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export function WebsiteJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'honni',
    description: 'Платформа для читання ранобе та новел',
    url: 'https://honni.fun',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://honni.fun/?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
