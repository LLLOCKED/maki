import { describe, it, expect } from 'vitest'
import { getOrderBySql, buildNovelWhereClause } from '@/lib/novels'

describe('getOrderBySql', () => {
  it('should return DESC for desc sortOrder', () => {
    expect(getOrderBySql('rating', 'desc')).toBe('averageRating DESC')
    expect(getOrderBySql('views', 'desc')).toBe('viewCount DESC')
    expect(getOrderBySql('year', 'desc')).toBe('releaseYear DESC')
    expect(getOrderBySql('created', 'desc')).toBe('createdAt DESC')
    expect(getOrderBySql('title', 'desc')).toBe('title DESC')
  })

  it('should return ASC for asc sortOrder', () => {
    expect(getOrderBySql('rating', 'asc')).toBe('averageRating ASC')
    expect(getOrderBySql('views', 'asc')).toBe('viewCount ASC')
    expect(getOrderBySql('year', 'asc')).toBe('releaseYear ASC')
    expect(getOrderBySql('created', 'asc')).toBe('createdAt ASC')
    expect(getOrderBySql('title', 'asc')).toBe('title ASC')
  })

  it('should default to title ASC for unknown sortBy', () => {
    expect(getOrderBySql('unknown', 'asc')).toBe('title ASC')
    expect(getOrderBySql('', 'asc')).toBe('title ASC')
  })
})

describe('buildNovelWhereClause', () => {
  it('should always include APPROVED moderation status', () => {
    const result = buildNovelWhereClause({})
    expect(result.moderationStatus).toBe('APPROVED')
  })

  it('should parse genres from comma-separated string', () => {
    const result = buildNovelWhereClause({ genres: 'g1,g2,g3' })
    expect(result.genres).toEqual({ some: { genreId: { in: ['g1', 'g2', 'g3'] } } })
  })

  it('should parse tags from comma-separated string', () => {
    const result = buildNovelWhereClause({ tags: 't1,t2' })
    expect(result.tags).toEqual({ some: { tagId: { in: ['t1', 't2'] } } })
  })

  it('should parse authors from comma-separated string', () => {
    const result = buildNovelWhereClause({ authors: 'a1,a2' })
    expect(result.authors).toEqual({ some: { authorId: { in: ['a1', 'a2'] } } })
  })

  it('should include type filter when provided', () => {
    const result = buildNovelWhereClause({ type: 'ORIGINAL' })
    expect(result.type).toBe('ORIGINAL')
  })

  it('should include status filter when provided', () => {
    const result = buildNovelWhereClause({ status: 'ONGOING' })
    expect(result.status).toBe('ONGOING')
  })

  it('should include translationStatus filter when provided', () => {
    const result = buildNovelWhereClause({ translationStatus: 'TRANSLATING' })
    expect(result.translationStatus).toBe('TRANSLATING')
  })

  it('should build releaseYear range correctly', () => {
    const result = buildNovelWhereClause({ yearFrom: '2020', yearTo: '2024' })
    expect(result.releaseYear).toEqual({ gte: 2020, lte: 2024 })
  })

  it('should handle yearFrom only', () => {
    const result = buildNovelWhereClause({ yearFrom: '2020' })
    expect(result.releaseYear).toEqual({ gte: 2020 })
  })

  it('should handle yearTo only', () => {
    const result = buildNovelWhereClause({ yearTo: '2024' })
    expect(result.releaseYear).toEqual({ lte: 2024 })
  })

  it('should filter out empty genre/tag/author values', () => {
    const result = buildNovelWhereClause({ genres: 'g1,,g3' })
    expect(result.genres).toEqual({ some: { genreId: { in: ['g1', 'g3'] } } })
  })
})