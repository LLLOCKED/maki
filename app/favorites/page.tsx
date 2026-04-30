import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import HorizontalNovelCard from '@/components/horizontal-novel-card'
import { Heart } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Улюблені — honni',
}

export default async function FavoritesPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      novel: {
        include: {
          genres: { include: { genre: true } },
          chapters: {
            where: { moderationStatus: 'APPROVED' },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              title: true,
              number: true,
              volume: true,
              createdAt: true,
              teamId: true,
              team: { select: { slug: true, name: true } },
            },
          },
          authors: { include: { author: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const novels = favorites.map(f => f.novel).filter(n => n.moderationStatus === 'APPROVED')

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Heart className="h-6 w-6 text-red-500 fill-red-500" />
        <h1 className="text-2xl font-bold">Улюблені</h1>
      </div>

      {novels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Heart className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">У вас поки немає улюблених тайтлів</p>
          <Link href="/catalog">
            <Button>Перейти до каталогу</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {novels.map((novel) => (
            <HorizontalNovelCard
              key={novel.id}
              novel={{
                ...novel,
                genres: novel.genres,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}