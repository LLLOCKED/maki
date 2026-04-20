import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    })

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Користувач з таким email вже існує' },
        { status: 400 }
      )
    }

    // Check if name already taken (if provided)
    if (name) {
      const existingName = await prisma.user.findUnique({
        where: { name },
      })

      if (existingName) {
        return NextResponse.json(
          { error: 'Ім\'я користувача вже зайняте' },
          { status: 400 }
        )
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user with unverified email
    const user = await prisma.user.create({
      data: {
        name: name || null,
        email,
        passwordHash,
        emailVerified: null, // Explicitly unverified
      },
    })

    // Generate verification token
    const token = await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: crypto.randomUUID(),
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    })

    // Send verification email
    await sendVerificationEmail(email, token.token)

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      message: 'Перевірте свою пошту для підтвердження реєстрації',
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
