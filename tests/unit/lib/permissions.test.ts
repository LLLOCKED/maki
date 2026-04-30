import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockAuth = vi.fn()

vi.mock('@/lib/auth', () => ({
  auth: mockAuth,
}))

function session(role?: string) {
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

describe('permissions helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requireAdmin rejects anonymous users', async () => {
    mockAuth.mockResolvedValue(null)
    const { requireAdmin } = await import('@/lib/permissions')

    const result = await requireAdmin()

    expect(result).toBeInstanceOf(Response)
    expect((result as Response).status).toBe(401)
  })

  it('requireAdmin rejects non-admin users', async () => {
    mockAuth.mockResolvedValue(session('USER'))
    const { requireAdmin } = await import('@/lib/permissions')

    const result = await requireAdmin()

    expect(result).toBeInstanceOf(Response)
    expect((result as Response).status).toBe(403)
  })

  it('requireOwner accepts owners', async () => {
    mockAuth.mockResolvedValue(session('OWNER'))
    const { requireOwner } = await import('@/lib/permissions')

    const result = await requireOwner()

    expect((result as { user: { id: string } }).user.id).toBe('user-1')
  })
})
