import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Session } from 'next-auth'

const prismaMock = {
  team: {
    findUnique: vi.fn(),
  },
  teamMembership: {
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
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

const params = { params: Promise.resolve({ slug: 'team-slug' }) }

describe('POST /api/teams/[slug]/members', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(createMockSession('current-user-id'))
    prismaMock.team.findUnique.mockResolvedValue({ id: 'team-1', slug: 'team-slug' })
    prismaMock.user.findUnique.mockResolvedValue({ id: 'new-user-id' })
    prismaMock.teamMembership.findUnique
      .mockResolvedValueOnce({ userId: 'current-user-id', teamId: 'team-1', role: 'owner' })
      .mockResolvedValueOnce(null)
    prismaMock.teamMembership.create.mockResolvedValue({
      userId: 'new-user-id',
      teamId: 'team-1',
      role: 'member',
    })
  })

  it('rejects invalid roles', async () => {
    const request = new Request('http://localhost/api/teams/team-slug/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'new-user-id', role: 'owner' }),
    })

    const { POST } = await import('@/app/api/teams/[slug]/members/route')
    const response = await POST(request, params)

    expect(response.status).toBe(400)
    expect(prismaMock.teamMembership.create).not.toHaveBeenCalled()
  })

  it('prevents team admins from assigning elevated roles', async () => {
    prismaMock.teamMembership.findUnique
      .mockReset()
      .mockResolvedValueOnce({ userId: 'current-user-id', teamId: 'team-1', role: 'admin' })
      .mockResolvedValueOnce(null)

    const request = new Request('http://localhost/api/teams/team-slug/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'new-user-id', role: 'admin' }),
    })

    const { POST } = await import('@/app/api/teams/[slug]/members/route')
    const response = await POST(request, params)

    expect(response.status).toBe(403)
    expect(prismaMock.teamMembership.create).not.toHaveBeenCalled()
  })
})
