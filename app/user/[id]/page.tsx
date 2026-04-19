import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, BookOpen, MessageCircle, Users, Star } from 'lucide-react'

interface UserPageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: UserPageProps) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { name: true },
  })

  if (!user) return { title: 'Користувач не знайден' }
  return { title: `${user.name || 'Користувач'} — honni` }
}

export default async function UserPage({ params }: UserPageProps) {
  const session = await auth()

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      teamMemberships: {
        include: {
          team: true,
        },
      },
      comments: {
        orderBy: { createdAt: 'desc' },
        take: 10,
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
      favorites: {
        take: 10,
        select: { id: true, slug: true, title: true, coverUrl: true },
      },
    },
  })

  if (!user) {
    notFound()
  }

  const isOwn = session?.user?.id === user.id

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-start gap-6">
        <div className="h-24 w-24 overflow-hidden rounded-full bg-muted">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || ''}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <User className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{user.name || 'Користувач'}</h1>
          {isOwn && user.email && (
            <p className="text-muted-foreground">{user.email}</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            На сайті з {new Date(user.createdAt).toLocaleDateString('uk-UA')}
          </p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="space-y-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <BookOpen className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{user.favorites.length}</p>
                <p className="text-sm text-muted-foreground">В обраному</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <Star className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{user.ratings.length}</p>
                <p className="text-sm text-muted-foreground">Оцінок</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <MessageCircle className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{user.comments.length}</p>
                <p className="text-sm text-muted-foreground">Коментарів</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-8">
          {user.teamMemberships.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                <Users className="h-5 w-5" />
                Команди
              </h2>
              <div className="flex flex-wrap gap-2">
                {user.teamMemberships.map((membership) => (
                  <Link key={membership.id} href={`/team/${membership.team.id}`}>
                    <Badge variant="outline" className="hover:bg-muted">
                      {membership.team.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {user.favorites.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                <BookOpen className="h-5 w-5" />
                Обране
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {user.favorites.map((novel) => (
                  <Link key={novel.id} href={`/novel/${novel.slug}`}>
                    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
                      <div className="aspect-[3/4] bg-muted">
                        {novel.coverUrl ? (
                          <img
                            src={novel.coverUrl}
                            alt={novel.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <BookOpen className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-2">
                        <p className="line-clamp-2 text-sm font-medium">{novel.title}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {user.ratings.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                <Star className="h-5 w-5 text-yellow-500" />
                Оцінки
              </h2>
              <div className="space-y-2">
                {user.ratings.slice(0, 5).map((rating) => (
                  <Link key={rating.id} href={`/novel/${rating.novel.slug}`}>
                    <Card className="flex items-center gap-4 p-3 transition-colors hover:bg-muted">
                      <div className="h-12 w-9 overflow-hidden rounded bg-muted">
                        {rating.novel.coverUrl ? (
                          <img
                            src={rating.novel.coverUrl}
                            alt={rating.novel.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{rating.novel.title}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= rating.value
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted'
                            }`}
                          />
                        ))}
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {user.comments.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                <MessageCircle className="h-5 w-5 text-blue-500" />
                Коментарі
              </h2>
              <div className="space-y-2">
                {user.comments.slice(0, 5).map((comment) => (
                  <Card key={comment.id} className="p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm">
                      <Link
                        href={`/novel/${comment.novel?.slug}`}
                        className="font-medium hover:underline"
                      >
                        {comment.novel?.title || 'Новела'}
                      </Link>
                      {comment.chapter && (
                        <span className="text-muted-foreground">
                          Глава {comment.chapter.number}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString('uk-UA')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {comment.content}
                    </p>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}