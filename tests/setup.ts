import { vi } from 'vitest'

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/maki_test'
process.env.AUTH_SECRET = 'test-secret-for-testing-only'
process.env.AUTH_GOOGLE_ID = 'test-google-client-id'
process.env.AUTH_GOOGLE_SECRET = 'test-google-client-secret'

// Import the shared auth mock from mocks/auth.ts
const { authMock } = await import('@/tests/mocks/auth')

// Mock NextAuth with the shared mock function
vi.mock('@/lib/auth', () => ({
  auth: authMock,
  handlers: {
    GET: vi.fn(),
    POST: vi.fn(),
  },
  signIn: vi.fn(),
  signOut: vi.fn(),
}))
