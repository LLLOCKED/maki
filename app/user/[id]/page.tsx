import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import ProfileClient from './profile-client'

interface UserPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: UserPageProps) {
  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    select: { name: true },
  })

  if (!user) return { title: 'Користувач не знайдено' }
  return { title: `${user.name || 'Користувач'} — honni` }
}

export default async function UserPage({ params }: UserPageProps) {
  const { id } = await params
  const session = await auth()

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      teamMemberships: {
        include: {
          team: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
      comments: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          novel: {
            select: { id: true, slug: true, title: true },
          },
          chapter: {
            select: { id: true, number: true },
          },
        },
      },
      ratings: {
        include: {
          novel: {
            select: { id: true, slug: true, title: true, coverUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      userFavorites: {
        take: 20,
        include: {
          novel: {
            select: { id: true, slug: true, title: true, coverUrl: true },
          },
        },
      },
      novels: {
        where: { moderationStatus: { not: 'PENDING' } },
        select: {
          id: true,
          slug: true,
          title: true,
          coverUrl: true,
          type: true,
          moderationStatus: true,
          authorId: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: {
          comments: true,
          ratings: true,
        },
      },
    },
  })

  if (!user) {
    notFound()
  }

  const isOwn = session?.user?.id === user.id
  const isModerator = ['OWNER', 'ADMIN', 'MODERATOR'].includes(session?.user?.role || '')

  // For non-own profiles, filter out favorites (privacy) and show only public novels
  // But for own profile, we show all

  // Build favorites with novel data from userFavorites (new model)
  const favoritesWithNovels = user.userFavorites.map(f => f.novel).filter(Boolean)

  // Build user data for client
  const userData = {
    ...user,
    favorites: favoritesWithNovels.map(n => ({ id: n!.id, slug: n!.slug, title: n!.title, coverUrl: n!.coverUrl })),
    novels: user.novels,
    _count: {
      ...user._count,
      favorites: user.userFavorites.length,
    },
  }

  return <ProfileClient user={userData as any} isOwn={isOwn} />
}