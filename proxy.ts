import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const guestOnlyPaths = new Set(['/login', '/register', '/forgot-password', '/reset-password'])

async function getAuthToken(request: NextRequest) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) return null

  return (
    await getToken({
      req: request,
      secret,
      secureCookie: true,
    })
  ) || (
    await getToken({
      req: request,
      secret,
      secureCookie: false,
    })
  )
}

function getSafeRedirectUrl(request: NextRequest): URL {
  const callbackUrl = request.nextUrl.searchParams.get('callbackUrl')
  if (!callbackUrl) return new URL('/', request.url)

  try {
    const target = new URL(callbackUrl, request.url)
    if (target.origin !== request.nextUrl.origin) return new URL('/', request.url)
    if (guestOnlyPaths.has(target.pathname)) return new URL('/', request.url)
    return target
  } catch {
    return new URL('/', request.url)
  }
}

export async function proxy(request: NextRequest) {
  const token = await getAuthToken(request)

  if (token) {
    return NextResponse.redirect(getSafeRedirectUrl(request))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/login', '/register', '/forgot-password', '/reset-password'],
}
