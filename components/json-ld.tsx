import Script from 'next/script'

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
    <Script
      id={`novel-json-ld-${slug}`}
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
    <Script
      id="website-json-ld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

interface ArticleJsonLdProps {
  title: string
  description: string
  url: string
  datePublished?: Date | string
  dateModified?: Date | string
  authorName?: string | null
}

export function ArticleJsonLd({
  title,
  description,
  url,
  datePublished,
  dateModified,
  authorName,
}: ArticleJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url,
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified }),
    ...(authorName && {
      author: {
        '@type': 'Person',
        name: authorName,
      },
    }),
  }

  return (
    <Script
      id={`article-json-ld-${url.replace(/[^a-z0-9]/gi, '-')}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

interface BreadcrumbItem {
  name: string
  url: string
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <Script
      id={`breadcrumbs-json-ld-${items.map((item) => item.name).join('-')}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
