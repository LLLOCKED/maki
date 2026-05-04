import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Session } from 'next-auth'

const uploadToFTPMock = vi.fn()
const mkdirMock = vi.fn()
const writeFileMock = vi.fn()
const prepareImageUploadMock = vi.fn()

vi.mock('@/lib/ftp', () => ({
  uploadToFTP: uploadToFTPMock,
}))

vi.mock('fs/promises', () => ({
  mkdir: mkdirMock,
  writeFile: writeFileMock,
}))

vi.mock('@/lib/image-upload', () => ({
  prepareImageUpload: prepareImageUploadMock,
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
    prepareImageUploadMock.mockResolvedValue({ buffer: Buffer.from('webp'), extension: 'webp', contentType: 'image/webp' })
    mkdirMock.mockResolvedValue(undefined)
    writeFileMock.mockResolvedValue(undefined)
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
    prepareImageUploadMock.mockResolvedValue({ error: 'Invalid image content' })
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

  it('falls back to local poster storage when FTP upload fails', async () => {
    mockAuth.mockResolvedValue(createMockSession('user-id'))
    uploadToFTPMock.mockRejectedValue(new Error('FTP unavailable'))
    const formData = new FormData()
    formData.append('file', new File([new Uint8Array([1, 2, 3])], 'poster.png', { type: 'image/png' }))

    const request = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: formData,
    })

    const { POST } = await import('@/app/api/upload/route')
    const response = await POST(request as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.url).toMatch(/^\/uploads\/posters\/.+\.webp$/)
    expect(mkdirMock).toHaveBeenCalled()
    expect(writeFileMock).toHaveBeenCalled()
  })
})
