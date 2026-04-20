import { describe, it, expect, vi, beforeEach } from 'vitest'
import { testNovels } from '@/tests/fixtures/novels'
import type { Session } from 'next-auth'

const prismaMock = {
  novel: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
  },
  $queryRaw: vi.fn(),
}

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

const mockAuth = vi.fn()

vi.mock('@/lib/auth', () => ({
  auth: mockAuth,
}))

function createMockSession(userId: string, role = 'USER'): Session {
  return {
    user: { id: userId, name: 'Test', email: 'test@test.com', role },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }
}

describe('GET /api/novels', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return novels list with pagination', async () => {
    const mockNovels = [testNovels.original, testNovels.translated]
    prismaMock.novel.findMany.mockResolvedValue(mockNovels)
    prismaMock.novel.count.mockResolvedValue(2)

    const { GET } = await import('@/app/api/novels/route')
    const request = new Request('http://localhost/api/novels')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.novels).toHaveLength(2)
    expect(data.hasMore).toBe(false)
    expect(data.total).toBe(2)
  })

  it('should filter by type', async () => {
    prismaMock.novel.findMany.mockResolvedValue([testNovels.original])
    prismaMock.novel.count.mockResolvedValue(1)

    const request = new Request('http://localhost/api/novels?type=ORIGINAL')
    const { GET } = await import('@/app/api/novels/route')
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(prismaMock.novel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ type: 'ORIGINAL' }),
      })
    )
  })

  it('should filter by status', async () => {
    prismaMock.novel.findMany.mockResolvedValue([testNovels.original])
    prismaMock.novel.count.mockResolvedValue(1)

    const request = new Request('http://localhost/api/novels?status=ONGOING')
    const { GET } = await import('@/app/api/novels/route')
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(prismaMock.novel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'ONGOING' }),
      })
    )
  })
})

describe('POST /api/novels', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(null)
  })

  it('should create ORIGINAL novel with authorId set', async () => {
    mockAuth.mockResolvedValue(createMockSession('user-author-id'))

    const mockNovel = { ...testNovels.original, id: 'new-novel-id' }
    prismaMock.novel.create.mockResolvedValue(mockNovel)

    const request = new Request('http://localhost/api/novels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'New Original Novel',
        slug: 'new-original-novel',
        description: 'A new original work',
        type: 'ORIGINAL',
      }),
    })

    const { POST } = await import('@/app/api/novels/route')
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(prismaMock.novel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'New Original Novel',
          authorId: 'user-author-id',
          moderationStatus: 'PENDING',
        }),
      })
    )
  })

  it('should create translated novel without authorId', async () => {
    mockAuth.mockResolvedValue(createMockSession('user-regular-id'))

    const mockNovel = { ...testNovels.translated, id: 'new-translated-id' }
    prismaMock.novel.create.mockResolvedValue(mockNovel)

    const request = new Request('http://localhost/api/novels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'New Translated Novel',
        slug: 'new-translated-novel',
        description: 'A new translation',
        type: 'JAPAN',
      }),
    })

    const { POST } = await import('@/app/api/novels/route')
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(prismaMock.novel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'New Translated Novel',
          authorId: null,
        }),
      })
    )
  })

  it('should reject unauthenticated request', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new Request('http://localhost/api/novels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'New Novel',
        slug: 'new-novel',
        description: 'Description',
      }),
    })

    const { POST } = await import('@/app/api/novels/route')
    const response = await POST(request)

    expect(response.status).toBe(401)
  })

  it('should require title, slug, description', async () => {
    mockAuth.mockResolvedValue(createMockSession('user-id'))

    const request = new Request('http://localhost/api/novels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Only Title',
      }),
    })

    const { POST } = await import('@/app/api/novels/route')
    const response = await POST(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('required')
  })
})
