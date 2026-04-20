import { vi } from 'vitest'

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/maki_test'
process.env.AUTH_SECRET = 'test-secret-for-testing-only'
process.env.AUTH_GOOGLE_ID = 'test-google-client-id'
process.env.AUTH_GOOGLE_SECRET = 'test-google-client-secret'

// Mock NextAuth with a simple mock function
const mockAuth = vi.fn()

vi.mock('@/lib/auth', () => ({
  auth: mockAuth,
  handlers: {
    GET: vi.fn(),
    POST: vi.fn(),
  },
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

export { mockAuth }
