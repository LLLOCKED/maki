import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Session } from 'next-auth'

const uploadToFTPMock = vi.fn()

vi.mock('@/lib/ftp', () => ({
  uploadToFTP: uploadToFTPMock,
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

describe('POST /api/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(null)
    uploadToFTPMock.mockResolvedValue('https://edge-drive.cdn.express/posters/test.png')
  })

  it('rejects unauthenticated uploads', async () => {
    const formData = new FormData()
    formData.append('file', new File([new Uint8Array([1, 2, 3])], 'test.png', { type: 'image/png' }))

    const request = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: formData,
    })

    const { POST } = await import('@/app/api/upload/route')
    const response = await POST(request as any)

    expect(response.status).toBe(401)
    expect(uploadToFTPMock).not.toHaveBeenCalled()
  })

  it('rejects files with spoofed image MIME type', async () => {
    mockAuth.mockResolvedValue(createMockSession('user-id'))
    const formData = new FormData()
    formData.append('file', new File([new Uint8Array([1, 2, 3])], 'test.png', { type: 'image/png' }))

    const request = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: formData,
    })

    const { POST } = await import('@/app/api/upload/route')
    const response = await POST(request as any)

    expect(response.status).toBe(400)
    expect(uploadToFTPMock).not.toHaveBeenCalled()
  })
})
