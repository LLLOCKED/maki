import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { isValidationResponse, parseJsonBody, resetPasswordSchema } from '@/lib/validation'

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request, resetPasswordSchema)
    if (isValidationResponse(body)) return body
    const { token, password } = body

    // Find and validate token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    })

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Недійсний токен' },
        { status: 400 }
      )
    }

    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { token },
      })
      return NextResponse.json(
        { error: 'Токен закінчився. Запитайте новий лист для скидання пароля' },
        { status: 400 }
      )
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10)

    // Update user password
    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { passwordHash },
    })

    // Delete used token
    await prisma.verificationToken.delete({
      where: { token },
    })

    return NextResponse.json({
      message: 'Пароль успішно змінено! Тепер ви можете увійти з новим паролем.',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
