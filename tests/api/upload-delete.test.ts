import { beforeEach, describe, expect, it, vi } from 'vitest'

const deleteFromFTPMock = vi.fn()
const authMock = vi.fn()

const prismaMock = {
  teamMembership: {
    findUnique: vi.fn(),
  },
}

vi.mock('@/lib/ftp', () => ({
  deleteFromFTP: deleteFromFTPMock,
}))

vi.mock('@/lib/auth', () => ({
  auth: authMock,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

function session(role = 'USER') {
  return {
    user: {
      id: 'user-1',
      name: 'Test',
      email: 'test@example.com',
      role,
    },
    expires: new Date(Date.now() + 60_000).toISOString(),
  }
}

describe('POST /api/upload/delete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue(session())
  })

  it('rejects deleting another user avatar', async () => {
    const request = new Request('http://localhost/api/upload/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        folder: 'avatars',
        filename: 'user-2-avatar.webp',
      }),
    })

    const { POST } = await import('@/app/api/upload/delete/route')
    const response = await POST(request)

    expect(response.status).toBe(403)
    expect(deleteFromFTPMock).not.toHaveBeenCalled()
  })

  it('allows team owners to delete team files', async () => {
    prismaMock.teamMembership.findUnique.mockResolvedValue({
      userId: 'user-1',
      teamId: 'team-1',
      role: 'owner',
    })

    const request = new Request('http://localhost/api/upload/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        folder: 'teams/team-1',
        filename: 'avatar.webp',
      }),
    })

    const { POST } = await import('@/app/api/upload/delete/route')
    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(deleteFromFTPMock).toHaveBeenCalledWith('avatar.webp', 'teams/team-1')
  })
})
