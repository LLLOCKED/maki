import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidationResponse, parseJsonBody, updateProfileSchema } from '@/lib/validation'
import { isAuthResponse, requireUser } from '@/lib/permissions'

export async function PATCH(request: Request) {
  const session = await requireUser()
  if (isAuthResponse(session)) return session

  try {
    const body = await parseJsonBody(request, updateProfileSchema)
    if (isValidationResponse(body)) return body
    const { name, image } = body

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        image,
      },
      select: {
        id: true,
        name: true,
        image: true,
        email: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
