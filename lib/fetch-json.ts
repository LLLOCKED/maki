export class FetchJsonError extends Error {
  status: number
  payload: unknown

  constructor(message: string, status: number, payload?: unknown) {
    super(message)
    this.name = 'FetchJsonError'
    this.status = status
    this.payload = payload
  }
}

function getPayloadMessage(payload: unknown) {
  if (!payload || typeof payload !== 'object') return null

  const data = payload as { error?: unknown; message?: unknown }
  if (typeof data.error === 'string') return data.error
  if (typeof data.message === 'string') return data.message

  return null
}

export async function parseJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || ''
  const text = await response.text()
  let payload: unknown

  if (text && contentType.includes('application/json')) {
    try {
      payload = JSON.parse(text)
    } catch {
      throw new FetchJsonError('Некоректна JSON-відповідь сервера', response.status)
    }
  } else if (text) {
    if (!response.ok) {
      throw new FetchJsonError(`HTTP ${response.status}`, response.status, text)
    }
    throw new FetchJsonError('Сервер повернув відповідь не у форматі JSON', response.status, text)
  }

  if (!response.ok) {
    throw new FetchJsonError(
      getPayloadMessage(payload) || `HTTP ${response.status}`,
      response.status,
      payload
    )
  }

  return payload as T
}

export async function safeFetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init)
  return parseJsonResponse<T>(response)
}
