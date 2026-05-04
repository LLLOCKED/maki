import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Session } from 'next-auth'

const prismaMock = {
  novel: {
    findUnique: vi.fn(),
  },
  chapter: {
    findUnique: vi.fn(),
  },
  contentReport: {
    create: vi.fn(),
    findMany: vi.fn(),
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

function createMockSession(userId: string, role = 'USER'): Session {
  return {
    user: { id: userId, name: 'Test', email: 'test@test.com', role },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }
}

const novelId = 'clh7d6m9x0000qwerty123456'
const chapterId = 'clh7d6m9x0001qwerty123456'
const reportId = 'clh7d6m9x0002qwerty123456'

describe('POST /api/reports', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(null)
  })

  it('should create a novel report', async () => {
    mockAuth.mockResolvedValue(createMockSession('user-1'))
    prismaMock.novel.findUnique.mockResolvedValue({ id: novelId })
    prismaMock.contentReport.create.mockResolvedValue({
      id: reportId,
      targetType: 'NOVEL',
      reason: 'Некоректний контент',
      novelId,
      userId: 'user-1',
    })

    const request = new Request('http://localhost/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetType: 'NOVEL',
        novelId,
        reason: 'Некоректний контент',
        details: 'Потрібна перевірка опису.',
      }),
    })

    const { POST } = await import('@/app/api/reports/route')
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.id).toBe(reportId)
    expect(prismaMock.contentReport.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        targetType: 'NOVEL',
        reason: 'Некоректний контент',
        details: 'Потрібна перевірка опису.',
        userId: 'user-1',
        novelId,
        chapterId: null,
      }),
    })
  })

  it('should create a chapter report', async () => {
    mockAuth.mockResolvedValue(createMockSession('user-2'))
    prismaMock.chapter.findUnique.mockResolvedValue({ id: chapterId, novelId })
    prismaMock.contentReport.create.mockResolvedValue({
      id: reportId,
      targetType: 'CHAPTER',
      reason: 'Помилка у розділі',
      chapterId,
      userId: 'user-2',
    })

    const request = new Request('http://localhost/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetType: 'CHAPTER',
        chapterId,
        reason: 'Помилка у розділі',
      }),
    })

    const { POST } = await import('@/app/api/reports/route')
    const response = await POST(request)

    expect(response.status).toBe(201)
    expect(prismaMock.contentReport.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        targetType: 'CHAPTER',
        userId: 'user-2',
        novelId: null,
        chapterId,
      }),
    })
  })

  it('should reject unauthenticated requests', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new Request('http://localhost/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetType: 'NOVEL',
        novelId,
        reason: 'Некоректний контент',
      }),
    })

    const { POST } = await import('@/app/api/reports/route')
    const response = await POST(request)

    expect(response.status).toBe(401)
  })

  it('should reject report without target id', async () => {
    mockAuth.mockResolvedValue(createMockSession('user-1'))

    const request = new Request('http://localhost/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetType: 'NOVEL',
        reason: 'Некоректний контент',
      }),
    })

    const { POST } = await import('@/app/api/reports/route')
    const response = await POST(request)

    expect(response.status).toBe(400)
    expect(prismaMock.contentReport.create).not.toHaveBeenCalled()
  })
})

describe('GET /api/admin/reports', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(null)
  })

  it('should list reports for admins', async () => {
    mockAuth.mockResolvedValue(createMockSession('admin-1', 'ADMIN'))
    prismaMock.contentReport.findMany.mockResolvedValue([])

    const request = new Request('http://localhost/api/admin/reports?status=OPEN')

    const { GET } = await import('@/app/api/admin/reports/route')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual([])
    expect(prismaMock.contentReport.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'OPEN' },
      })
    )
  })

  it('should reject non-admin users', async () => {
    mockAuth.mockResolvedValue(createMockSession('user-1', 'USER'))

    const request = new Request('http://localhost/api/admin/reports')

    const { GET } = await import('@/app/api/admin/reports/route')
    const response = await GET(request)

    expect(response.status).toBe(403)
  })
})

describe('PATCH /api/admin/reports', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(null)
  })

  it('should update report status and resolver', async () => {
    mockAuth.mockResolvedValue(createMockSession('admin-1', 'MODERATOR'))
    prismaMock.contentReport.update.mockResolvedValue({
      id: reportId,
      status: 'REVIEWED',
      resolvedBy: 'admin-1',
    })

    const request = new Request('http://localhost/api/admin/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: reportId,
        status: 'REVIEWED',
      }),
    })

    const { PATCH } = await import('@/app/api/admin/reports/route')
    const response = await PATCH(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('REVIEWED')
    expect(prismaMock.contentReport.update).toHaveBeenCalledWith({
      where: { id: reportId },
      data: expect.objectContaining({
        status: 'REVIEWED',
        resolvedBy: 'admin-1',
      }),
    })
  })
})
