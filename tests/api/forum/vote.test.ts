import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSession, authMock } from '@/tests/mocks/auth'

const prismaMock = {
  forumTopicVote: {
    upsert: vi.fn(),
    deleteMany: vi.fn(),
  },
}

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

describe('POST /api/forum/topics/vote', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue(null)
  })

  it('should create upvote', async () => {
    const session = createMockSession({ id: 'user-regular-id', email: 'user@test.com', name: 'User' })
    authMock.mockResolvedValue(session)

    const mockVote = {
      id: 'vote-new',
      value: 1,
      userId: 'user-regular-id',
      topicId: 'topic-1',
    }
    prismaMock.forumTopicVote.upsert.mockResolvedValue(mockVote)

    const request = new Request('http://localhost/api/forum/topics/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topicId: 'topic-1',
        value: 1,
      }),
    })

    const { POST } = await import('@/app/api/forum/topics/vote/route')
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.vote.value).toBe(1)
    expect(prismaMock.forumTopicVote.upsert).toHaveBeenCalledWith({
      where: {
        userId_topicId: {
          userId: 'user-regular-id',
          topicId: 'topic-1',
        },
      },
      update: { value: 1 },
      create: {
        userId: 'user-regular-id',
        topicId: 'topic-1',
        value: 1,
      },
    })
  })

  it('should create downvote', async () => {
    const session = createMockSession({ id: 'user-author-id', email: 'author@test.com', name: 'Author' })
    authMock.mockResolvedValue(session)

    const mockVote = {
      id: 'vote-new',
      value: -1,
      userId: 'user-author-id',
      topicId: 'topic-1',
    }
    prismaMock.forumTopicVote.upsert.mockResolvedValue(mockVote)

    const request = new Request('http://localhost/api/forum/topics/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topicId: 'topic-1',
        value: -1,
      }),
    })

    const { POST } = await import('@/app/api/forum/topics/vote/route')
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.vote.value).toBe(-1)
  })

  it('should remove vote when value is 0', async () => {
    const session = createMockSession({ id: 'user-regular-id', email: 'user@test.com', name: 'User' })
    authMock.mockResolvedValue(session)

    prismaMock.forumTopicVote.deleteMany.mockResolvedValue({ count: 1 })

    const request = new Request('http://localhost/api/forum/topics/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topicId: 'topic-1',
        value: 0,
      }),
    })

    const { POST } = await import('@/app/api/forum/topics/vote/route')
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.vote).toBeNull()
    expect(prismaMock.forumTopicVote.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-regular-id',
        topicId: 'topic-1',
      },
    })
  })

  it('should reject unauthenticated request', async () => {
    authMock.mockResolvedValue(null)

    const request = new Request('http://localhost/api/forum/topics/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topicId: 'topic-1',
        value: 1,
      }),
    })

    const { POST } = await import('@/app/api/forum/topics/vote/route')
    const response = await POST(request)

    expect(response.status).toBe(401)
  })

  it('should reject invalid vote value', async () => {
    const session = createMockSession({ id: 'user-id', email: 'test@test.com', name: 'User' })
    authMock.mockResolvedValue(session)

    const request = new Request('http://localhost/api/forum/topics/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topicId: 'topic-1',
        value: 5,
      }),
    })

    const { POST } = await import('@/app/api/forum/topics/vote/route')
    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('should reject missing topicId', async () => {
    const session = createMockSession({ id: 'user-id', email: 'test@test.com', name: 'User' })
    authMock.mockResolvedValue(session)

    const request = new Request('http://localhost/api/forum/topics/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        value: 1,
      }),
    })

    const { POST } = await import('@/app/api/forum/topics/vote/route')
    const response = await POST(request)

    expect(response.status).toBe(400)
  })
})
