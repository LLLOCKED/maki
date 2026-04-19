export function getOrderBySql(sortBy: string, sortOrder: string): string {
  const order = sortOrder === 'desc' ? 'DESC' : 'ASC'
  if (sortBy === 'rating') return `averageRating ${order}`
  if (sortBy === 'views') return `viewCount ${order}`
  if (sortBy === 'year') return `releaseYear ${order}`
  if (sortBy === 'created') return `createdAt ${order}`
  return `title ${order}`
}

export function buildNovelWhereClause(params: {
  search?: string
  genres?: string
  tags?: string
  authors?: string
  type?: string
  status?: string
  translationStatus?: string
  yearFrom?: string
  yearTo?: string
}): any {
  const where: any = {
    moderationStatus: 'APPROVED',
  }

  if (params.genres) {
    const genreIds = params.genres.split(',').filter(Boolean)
    if (genreIds.length) {
      where.genres = { some: { genreId: { in: genreIds } } }
    }
  }

  if (params.tags) {
    const tagIds = params.tags.split(',').filter(Boolean)
    if (tagIds.length) {
      where.tags = { some: { tagId: { in: tagIds } } }
    }
  }

  if (params.authors) {
    const authorIds = params.authors.split(',').filter(Boolean)
    if (authorIds.length) {
      where.authors = { some: { authorId: { in: authorIds } } }
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
