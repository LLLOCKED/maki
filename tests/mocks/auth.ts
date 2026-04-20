import { vi } from 'vitest'
import type { Session } from 'next-auth'

interface MockUser {
  id: string
  name?: string | null
  email?: string | null
  role?: string
}

// Create mock outside to ensure same reference
export const authMock = vi.fn()

export function createMockSession(user: MockUser): Session {
  return {
    user: {
      id: user.id,
      name: user.name ?? null,
      email: user.email ?? null,
      role: user.role ?? 'USER',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }
}

export const mockSessions = {
  owner: createMockSession({ id: 'user-owner-id', name: 'Owner', role: 'OWNER' }),
  admin: createMockSession({ id: 'user-admin-id', name: 'Admin', role: 'ADMIN' }),
  moderator: createMockSession({ id: 'user-mod-id', name: 'Moderator', role: 'MODERATOR' }),
  user: createMockSession({ id: 'user-regular-id', name: 'User', role: 'USER' }),
  author: createMockSession({ id: 'user-author-id', name: 'Author', role: 'USER' }),
}

// Set default mock implementation for when auth is called directly
authMock.mockResolvedValue(null)
