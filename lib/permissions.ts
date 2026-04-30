import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import type { Session } from 'next-auth'

export const USER_ROLES = ['OWNER', 'ADMIN', 'MODERATOR', 'USER'] as const
export const ADMIN_ROLES = ['OWNER', 'ADMIN', 'MODERATOR'] as const
export const OWNER_ROLES = ['OWNER'] as const

export type UserRole = (typeof USER_ROLES)[number]

type AppSession = Session & {
  user: NonNullable<Session['user']> & {
    id: string
    role?: string
  }
}

export function authError(status: 401 | 403, error: string) {
  return NextResponse.json({ error }, { status })
}

export function hasRole(
  session: Session | null | undefined,
  roles: readonly string[]
): session is AppSession {
  return Boolean(
    session?.user?.id &&
      session.user.role &&
      roles.includes(session.user.role)
  )
}

export async function requireUser(): Promise<AppSession | NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return authError(401, 'Unauthorized')
  }
  return session as AppSession
}

export async function requireAnyRole(
  roles: readonly string[]
): Promise<AppSession | NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return authError(401, 'Unauthorized')
  }
  if (!hasRole(session, roles)) {
    return authError(403, 'Forbidden')
  }
  return session
}

export async function requireAdmin() {
  return requireAnyRole(ADMIN_ROLES)
}

export async function requireOwner() {
  return requireAnyRole(OWNER_ROLES)
}

export function isAuthResponse(value: AppSession | NextResponse): value is NextResponse {
  return value instanceof NextResponse
}
