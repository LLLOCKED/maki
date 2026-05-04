export function getOrderBySql(sortBy: string, sortOrder: string): string {
  const order = sortOrder === 'desc' ? 'DESC' : 'ASC'
  if (sortBy === 'rating') return `"averageRating" ${order}, "id" ASC`
  if (sortBy === 'views') return `"viewCount" ${order}, "id" ASC`
  if (sortBy === 'year') return `"releaseYear" ${order}, "id" ASC`
  if (sortBy === 'created') return `"createdAt" ${order}, "id" ASC`
  return `"title" ${order}, "id" ASC`
}

export function buildNovelWhereClause(params: {
  search?: string
  genres?: string
  tags?: string
  authors?: string
  publishers?: string
  type?: string
  status?: string
  translationStatus?: string
  yearFrom?: string
  yearTo?: string
}): any {
  const where: any = {
    moderationStatus: 'APPROVED',
    deletedAt: null,
  }

  if (params.genres) {
    const genreSlugs = params.genres.split(',').filter(Boolean)
    if (genreSlugs.length) {
      where.genres = { some: { genre: { slug: { in: genreSlugs } } } }
    }
  }

  if (params.tags) {
    const tagSlugs = params.tags.split(',').filter(Boolean)
    if (tagSlugs.length) {
      where.tags = { some: { tag: { slug: { in: tagSlugs } } } }
    }
  }

  if (params.authors) {
    const authorSlugs = params.authors.split(',').filter(Boolean)
    if (authorSlugs.length) {
      where.authors = { some: { author: { slug: { in: authorSlugs } } } }
    }
  }

  if (params.publishers) {
    const publisherSlugs = params.publishers.split(',').filter(Boolean)
    if (publisherSlugs.length) {
      where.publishers = { some: { publisher: { slug: { in: publisherSlugs } } } }
    }
  }

  if (params.type) {
    where.type = params.type
  }

  if (params.status) {
    where.status = params.status
  }

  if (params.translationStatus) {
    where.translationStatus = params.translationStatus
  }

  if (params.yearFrom || params.yearTo) {
    where.releaseYear = {}
    if (params.yearFrom) {
      where.releaseYear.gte = parseInt(params.yearFrom)
    }
    if (params.yearTo) {
      where.releaseYear.lte = parseInt(params.yearTo)
    }
  }

  return where
}
