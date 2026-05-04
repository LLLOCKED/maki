import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Session } from 'next-auth'
import { DEFAULT_AVATAR_URL } from '@/lib/default-avatar'

const prismaMock = {
  user: {
    update: vi.fn(),
  },
}

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

const mockAuth = vi.fn()

vi.mock('@/lib/auth', () => ({
  auth: mockAuth,
}))

function createMockSession(userId: string): Session {
  return {
    user: { id: userId, name: 'Test', email: 'test@test.com', role: 'USER' },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }
}

describe('PATCH /api/user/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(createMockSession('user-1'))
  })

  it('should save the default avatar when image is cleared', async () => {
    prismaMock.user.update.mockResolvedValue({
      id: 'user-1',
      name: 'Новий нік',
      image: DEFAULT_AVATAR_URL,
      email: 'test@test.com',
    })

    const request = new Request('http://localhost/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Новий нік', image: null }),
    })

    const { PATCH } = await import('@/app/api/user/profile/route')
    const response = await PATCH(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.image).toBe(DEFAULT_AVATAR_URL)
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: {
          name: 'Новий нік',
          image: DEFAULT_AVATAR_URL,
        },
      })
    )
  })

  it('should keep a custom avatar when provided', async () => {
    const customAvatar = '/uploads/avatar.webp'
    prismaMock.user.update.mockResolvedValue({
      id: 'user-1',
      name: 'Новий нік',
      image: customAvatar,
      email: 'test@test.com',
    })

    const request = new Request('http://localhost/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Новий нік', image: customAvatar }),
    })

    const { PATCH } = await import('@/app/api/user/profile/route')
    const response = await PATCH(request)

    expect(response.status).toBe(200)
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ image: customAvatar }),
      })
    )
  })
})
