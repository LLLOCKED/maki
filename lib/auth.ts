import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { DEFAULT_AVATAR_URL } from './default-avatar'
import { getClientIp, rateLimit } from './rate-limit'

async function getSessionUser(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { role: true, name: true, image: true, isBanned: true },
  })
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma as any),
  trustHost: true,
  session: {
    strategy: 'jwt',
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = String(credentials.email).toLowerCase()
        const ip = request ? getClientIp(request) : 'unknown'
        const loginLimit = rateLimit({
          key: `login:${ip}:${email}`,
          limit: 5,
          windowMs: 10 * 60 * 1000,
        })
        if (!loginLimit.success) {
          throw new Error('Too many login attempts')
        }

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user || !user.passwordHash) {
          return null
        }

        if (!user.emailVerified) {
          throw new Error('Email not verified')
        }

        if (user.isBanned) {
          throw new Error('User banned')
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      const now = Math.floor(Date.now() / 1000)

      if (user) {
        token.id = user.id
        token.image = user.image as string | null
        token.lastRefresh = now

        if (user.id) {
          try {
            const dbUser = await getSessionUser(user.id)
            token.role = dbUser?.role || 'USER'
            token.name = dbUser?.name || token.name
            token.image = dbUser?.image || DEFAULT_AVATAR_URL
            token.isBanned = dbUser?.isBanned || false
          } catch (error) {
            console.error('JWT login refresh error:', error)
            token.role = (user as any).role || 'USER'
          }
        }
      }

      if (trigger === 'update' && session) {
        if (session.name) token.name = session.name
        if (session.image) token.image = session.image
        if (session.role) token.role = session.role
        token.lastRefresh = now
      }

      const shouldRefresh = !token.lastRefresh || (now - (token.lastRefresh as number)) > 60

      if (token.id && shouldRefresh) {
        try {
          const dbUser = await getSessionUser(token.id as string)
          if (dbUser) {
            token.role = dbUser.role
            token.name = dbUser.name
            token.image = dbUser.image || DEFAULT_AVATAR_URL
            token.isBanned = dbUser.isBanned
            token.lastRefresh = now
          }
        } catch (error) {
          console.error('JWT refresh error:', error)
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        const userSession = session.user as { id?: string; role?: string; name?: string | null; image?: string | null }
        userSession.id = token.id as string
        userSession.role = token.role as string || 'USER'
        userSession.name = token.name as string | null
        userSession.image = (token.image as string | null) || DEFAULT_AVATAR_URL
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
})
