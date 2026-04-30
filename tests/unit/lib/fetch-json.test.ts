import { describe, expect, it } from 'vitest'
import { FetchJsonError, parseJsonResponse } from '@/lib/fetch-json'

describe('fetch-json helpers', () => {
  it('parses successful JSON responses', async () => {
    const response = Response.json({ count: 2 })

    await expect(parseJsonResponse<{ count: number }>(response)).resolves.toEqual({ count: 2 })
  })

  it('throws API error messages from JSON payloads', async () => {
    const response = Response.json({ error: 'Unauthorized' }, { status: 401 })

    await expect(parseJsonResponse(response)).rejects.toMatchObject({
      name: 'FetchJsonError',
      status: 401,
      message: 'Unauthorized',
    })
  })

  it('throws a typed error for non-JSON HTML responses', async () => {
    const response = new Response('<!DOCTYPE html>', {
      status: 404,
      headers: { 'content-type': 'text/html' },
    })

    try {
      await parseJsonResponse(response)
      throw new Error('Expected parseJsonResponse to throw')
    } catch (error) {
      expect(error).toBeInstanceOf(FetchJsonError)
      expect(error).toMatchObject({
        status: 404,
        message: 'HTTP 404',
      })
    }
  })
})
