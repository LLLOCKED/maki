import { describe, it, expect, vi, beforeEach } from 'vitest'
import { testNovels } from '@/tests/fixtures/novels'
import { createMockSession, authMock } from '@/tests/mocks/auth'

const prismaMock = {
  novel: {
    findUnique: vi.fn(),
  },
  chapter: {
    create: vi.fn(),
  },
}

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

describe('POST /api/chapters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue(null)
  })

  it('should allow author to add chapter to ORIGINAL novel', async () => {
    const session = createMockSession({ id: 'user-author-id', email: 'author@test.com', name: 'Author' })
    authMock.mockResolvedValue(session)

    const mockNovel = {
      ...testNovels.original,
      authorId: 'user-author-id',
    }
    prismaMock.novel.findUnique.mockResolvedValue(mockNovel)

    const mockChapter = {
      id: 'chapter-new',
      title: 'Chapter 1',
      number: 1,
      content: 'Content here',
      novelId: 'novel-original-id',
      teamId: null,
      moderationStatus: 'PENDING',
    }
    prismaMock.chapter.create.mockResolvedValue(mockChapter)

    const request = new Request('http://localhost/api/chapters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Chapter 1',
        number: 1,
        novelId: 'novel-original-id',
      }),
    })

    const { POST } = await import('@/app/api/chapters/route')
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.teamId).toBeNull()
    expect(data.moderationStatus).toBe('PENDING')
  })

  it('should reject non-author adding chapter to ORIGINAL novel', async () => {
    const session = createMockSession({ id: 'user-other-id', email: 'other@test.com', name: 'Other User' })
    authMock.mockResolvedValue(session)

    const mockNovel = {
      ...testNovels.original,
      authorId: 'user-author-id',
    }
    prismaMock.novel.findUnique.mockResolvedValue(mockNovel)

    const request = new Request('http://localhost/api/chapters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Chapter 1',
        number: 1,
        novelId: 'novel-original-id',
      }),
    })

    const { POST } = await import('@/app/api/chapters/route')
    const response = await POST(request)

    expect(response.status).toBe(403)
    const data = await response.json()
    expect(data.error).toContain('Only the author')
  })

  it('should require teamId for translated novels', async () => {
    const session = createMockSession({ id: 'user-regular-id', email: 'user@test.com', name: 'User' })
    authMock.mockResolvedValue(session)

    prismaMock.novel.findUnique.mockResolvedValue(testNovels.translated)

    const request = new Request('http://localhost/api/chapters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Chapter 1',
        number: 1,
        novelId: 'novel-translated-id',
      }),
    })

    const { POST } = await import('@/app/api/chapters/route')
    const response = await POST(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Team is required')
  })

  it('should allow any user to add chapter to translated novel with teamId', async () => {
    const session = createMockSession({ id: 'user-regular-id', email: 'user@test.com', name: 'User' })
    authMock.mockResolvedValue(session)

    prismaMock.novel.findUnique.mockResolvedValue(testNovels.translated)

    const mockChapter = {
      id: 'chapter-new',
      title: 'Chapter 1',
      number: 1,
      content: 'Translated content',
      novelId: 'novel-translated-id',
      teamId: 'team-1',
      moderationStatus: 'PENDING',
    }
    prismaMock.chapter.create.mockResolvedValue(mockChapter)

    const request = new Request('http://localhost/api/chapters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Chapter 1',
        number: 1,
        novelId: 'novel-translated-id',
        teamId: 'team-1',
      }),
    })

    const { POST } = await import('@/app/api/chapters/route')
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.teamId).toBe('team-1')
  })

  it('should reject unauthenticated request', async () => {
    authMock.mockResolvedValue(null)

    const request = new Request('http://localhost/api/chapters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Chapter 1',
        number: 1,
        novelId: 'novel-original-id',
      }),
    })

    const { POST } = await import('@/app/api/chapters/route')
    const response = await POST(request)

    expect(response.status).toBe(401)
  })

  it('should return 404 for non-existent novel', async () => {
    const session = createMockSession({ id: 'user-id', email: 'test@test.com', name: 'User' })
    authMock.mockResolvedValue(session)

    prismaMock.novel.findUnique.mockResolvedValue(null)

    const request = new Request('http://localhost/api/chapters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Chapter 1',
        number: 1,
        novelId: 'non-existent-id',
      }),
    })

    const { POST } = await import('@/app/api/chapters/route')
    const response = await POST(request)

    expect(response.status).toBe(404)
  })
})
