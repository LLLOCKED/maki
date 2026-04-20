export const testUsers = {
  owner: {
    id: 'user-owner-id',
    name: 'Owner User',
    email: 'owner@test.com',
    role: 'OWNER',
  },
  admin: {
    id: 'user-admin-id',
    name: 'Admin User',
    email: 'admin@test.com',
    role: 'ADMIN',
  },
  moderator: {
    id: 'user-mod-id',
    name: 'Moderator User',
    email: 'mod@test.com',
    role: 'MODERATOR',
  },
  regularUser: {
    id: 'user-regular-id',
    name: 'Regular User',
    email: 'user@test.com',
    role: 'USER',
  },
  author: {
    id: 'user-author-id',
    name: 'Author User',
    email: 'author@test.com',
    role: 'USER',
  },
}

export { createMockSession } from '@/tests/mocks/auth'
export { mockSessions } from '@/tests/mocks/auth'