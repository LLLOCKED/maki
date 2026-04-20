import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Session } from 'next-auth'

const prismaMock = {
  forumTopicVote: {
    upsert: vi.fn(),
    deleteMany: vi.fn(),
  },
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

describe('POST /api/forum/topics/vote', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(null)
  })

  it('should create upvote', async () => {
    mockAuth.mockResolvedValue(createMockSession('user-regular-id'))

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
    mockAuth.mockResolvedValue(createMockSession('user-author-id'))

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
    mockAuth.mockResolvedValue(createMockSession('user-regular-id'))

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
    mockAuth.mockResolvedValue(null)

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
    mockAuth.mockResolvedValue(createMockSession('user-id'))

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
    mockAuth.mockResolvedValue(createMockSession('user-id'))

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
