import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Always return success to prevent email enumeration attacks
    // But only send email if user exists
    if (user && user.passwordHash) {
      // Delete any existing reset tokens for this email
      await prisma.verificationToken.deleteMany({
        where: { identifier: email },
      })

      // Create new reset token (1 hour expiry)
      const token = await prisma.verificationToken.create({
        data: {
          identifier: email,
          token: crypto.randomUUID(),
          expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      })

      await sendPasswordResetEmail(email, token.token)
    }

    return NextResponse.json({
      message: 'Якщо користувач з таким email існує, на нього буде надіслано лист для скидання пароля',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
