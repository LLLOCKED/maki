'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Activity, Bookmark, CalendarClock, User, Users, BookOpen, Settings, Star, MessageCircle, Heart } from 'lucide-react'
import UserPresence, { OnlineDot } from '@/components/user-presence'

interface UserData {
  id: string
  name: string | null
  email: string | null
  image: string | null
  createdAt: Date
  lastSeen: Date | string | null
  teamMemberships: { id: string; role: string; team: { id: string; name: string; slug: string } }[]
  comments: { id: string; content: string; createdAt: Date; novel?: { slug: string; title: string }; chapter?: { number: number } }[]
  ratings: { id: string; value: number; createdAt: Date; novel: { id: string; slug: string; title: string; coverUrl: string | null } }[]
  favorites: { id: string; slug: string; title: string; coverUrl: string | null }[]
  novels: { id: string; slug: string; title: string; coverUrl: string | null; type: string; moderationStatus: string; authorId: string | null }[]
  favoriteGenres: { name: string; count: number }[]
  recentBookmarks: {
    id: string
    status: string
    readingPosition: number | null
    readingProgress: number
    updatedAt: Date | string
    novel: { id: string; slug: string; title: string; coverUrl: string | null; chaptersCount: number }
  }[]
  activity: {
    id: string
    type: 'comment' | 'rating' | 'bookmark'
    date: Date | string
    title: string
    href: string
    label: string
  }[]
  _count: { comments: number; ratings: number; favorites: number }
}

interface ProfileSidebarProps {
  userId: string
  isOwn: boolean
}

const tabs = [
  { id: 'profile', label: 'Профіль', icon: User },
  { id: 'teams', label: 'Команди', icon: Users },
  { id: 'ratings', label: 'Оцінки', icon: Star },
  { id: 'favorites', label: 'Обране', icon: Heart },
  { id: 'comments', label: 'Коментарі', icon: MessageCircle },
]

const settingsTab = { id: 'settings', label: 'Налаштування', icon: Settings }

export default function ProfileClient({
  user,
  isOwn,
  isModerator,
}: {
  user: UserData & { _count: { comments: number; ratings: number; favorites: number } }
  isOwn: boolean
  isModerator: boolean
}) {
  const [activeTab, setActiveTab] = useState('profile')
  const params = useParams()

  const tabsWithSettings = isOwn ? [...tabs, settingsTab] : tabs

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <div className="relative h-20 w-20 shrink-0">
                <div className="h-full w-full overflow-hidden rounded-full bg-muted">
                  {user.image ? (
                    <img src={user.image} alt={user.name || ''} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <User className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <OnlineDot lastSeen={user.lastSeen} className="absolute bottom-1 right-1 h-4 w-4 border-2" />
              </div>
              <div className="min-w-0">
                <h1 className="break-words text-2xl font-bold">{user.name || 'Користувач'}</h1>
                {isOwn && user.email && <p className="break-all text-muted-foreground">{user.email}</p>}
                <UserPresence lastSeen={user.lastSeen} className="mt-1" />
                <p className="text-sm text-muted-foreground">На сайті з {new Date(user.createdAt).toLocaleDateString('uk-UA')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold">{user._count.favorites}</p>
                <p className="text-sm text-muted-foreground">В обраному</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold">{user._count.ratings}</p>
                <p className="text-sm text-muted-foreground">Оцінок</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold">{user._count.comments}</p>
                <p className="text-sm text-muted-foreground">Коментарів</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Bookmark className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">Прогрес читання</h2>
                </div>
                {(isOwn || isModerator) && user.recentBookmarks.length > 0 ? (
                  <div className="space-y-3">
                    {user.recentBookmarks.slice(0, 5).map((bookmark) => {
                      const chapterProgress = bookmark.novel.chaptersCount > 0 && bookmark.readingPosition
                        ? Math.min(100, Math.round((bookmark.readingPosition / bookmark.novel.chaptersCount) * 100))
                        : 0
                      return (
                        <Link key={bookmark.id} href={`/novel/${bookmark.novel.slug}`} className="block rounded-md p-2 hover:bg-muted">
                          <div className="mb-1 flex items-center justify-between gap-3">
                            <span className="line-clamp-1 text-sm font-medium">{bookmark.novel.title}</span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {bookmark.readingPosition ? `Гл. ${bookmark.readingPosition}` : 'Без прогресу'}
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div className="h-full bg-primary" style={{ width: `${chapterProgress}%` }} />
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {bookmark.readingProgress}% поточної глави
                          </p>
                        </Link>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {isOwn || isModerator ? 'Поки немає прогресу читання' : 'Прогрес читання приватний'}
                  </p>
                )}
              </div>

              <div className="rounded-lg border p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">Остання активність</h2>
                </div>
                {user.activity.length > 0 ? (
                  <div className="space-y-2">
                    {user.activity.slice(0, 6).map((item) => (
                      <Link key={item.id} href={item.href} className="block rounded-md p-2 hover:bg-muted">
                        <p className="line-clamp-1 text-sm font-medium">{item.title}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <CalendarClock className="h-3.5 w-3.5" />
                          <span>{item.label}</span>
                          <span>•</span>
                          <span>{new Date(item.date).toLocaleDateString('uk-UA')}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Активності поки немає</p>
                )}
              </div>
            </div>

            {user.favoriteGenres.length > 0 && (
              <div className="rounded-lg border p-4">
                <h2 className="mb-3 font-semibold">Улюблені жанри</h2>
                <div className="flex flex-wrap gap-2">
                  {user.favoriteGenres.map((genre) => (
                    <span key={genre.name} className="rounded-full border bg-muted/40 px-3 py-1 text-sm">
                      {genre.name}
                      <span className="ml-1 text-xs text-muted-foreground">{genre.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {user.novels.length > 0 && (
              <div>
                <h2 className="mb-3 font-semibold">Авторські роботи</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                  {user.novels.map((novel) => (
                    <Link key={novel.id} href={`/novel/${novel.slug}`}>
                      <div className="overflow-hidden rounded-lg border hover:shadow-lg">
                        <div className="aspect-[3/4] bg-muted">
                          {novel.coverUrl ? (
                            <img src={novel.coverUrl} alt={novel.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <BookOpen className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <p className="line-clamp-2 text-sm font-medium">{novel.title}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case 'teams':
        return (
          <div className="space-y-4">
            {isOwn && (
              <div className="mb-4">
                <Link href="/admin/teams/new">
                  <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                    + Створити команду
                  </button>
                </Link>
              </div>
            )}
            {user.teamMemberships.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {user.teamMemberships.map((membership) => (
                  <Link key={membership.id} href={`/team/${membership.team.slug}`}>
                    <div className="flex min-w-0 items-center gap-3 rounded-lg border p-4 hover:bg-muted">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{membership.team.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {membership.role === 'owner' ? 'Власник' : membership.role === 'admin' ? 'Адмін' : 'Учасник'}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Немає команд</p>
            )}
          </div>
        )

      case 'ratings':
        return user.ratings.length > 0 ? (
          <div className="space-y-2">
            {user.ratings.map((rating) => (
              <Link key={rating.id} href={`/novel/${rating.novel.slug}`}>
                <div className="flex min-w-0 flex-col gap-3 rounded-lg border p-3 hover:bg-muted sm:flex-row sm:items-center sm:gap-4">
                  <div className="h-16 w-12 shrink-0 overflow-hidden rounded bg-muted sm:h-12 sm:w-9">
                    {rating.novel.coverUrl ? (
                      <img src={rating.novel.coverUrl} alt={rating.novel.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 font-medium">{rating.novel.title}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${star <= rating.value ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`}
                      />
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Немає оцінок</p>
        )

      case 'favorites':
        return user.favorites.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {user.favorites.map((novel) => (
              <Link key={novel.id} href={`/novel/${novel.slug}`}>
                <div className="overflow-hidden rounded-lg border hover:shadow-lg">
                  <div className="aspect-[3/4] bg-muted">
                    {novel.coverUrl ? (
                      <img src={novel.coverUrl} alt={novel.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <BookOpen className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="line-clamp-2 text-sm font-medium">{novel.title}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Немає обраного</p>
        )

      case 'comments':
        return user.comments.length > 0 ? (
          <div className="space-y-2">
            {user.comments.map((comment) => (
              <div key={comment.id} className="rounded-lg border p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                  <Link href={`/novel/${comment.novel?.slug}`} className="min-w-0 font-medium hover:underline">
                    {comment.novel?.title || 'Новела'}
                  </Link>
                  {comment.chapter && <span className="text-muted-foreground">Глава {comment.chapter.number}</span>}
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleDateString('uk-UA')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{comment.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Немає коментарів</p>
        )

      case 'settings':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Налаштування профілю</h2>
            <Link href="/settings" className="block">
              <div className="flex items-center gap-3 rounded-lg border p-4 hover:bg-muted">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Редагування профілю</p>
                  <p className="text-sm text-muted-foreground">Змінити ім&apos;я, аватарку, пароль</p>
                </div>
              </div>
            </Link>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* Mobile navigation */}
        <div className="lg:hidden">
          <nav className="-mx-4 flex gap-2 overflow-x-auto border-b px-4 pb-3">
            {tabsWithSettings.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Left content */}
        <div className="min-w-0 flex-1">
          {renderContent()}
        </div>

        {/* Right sidebar - Navigation */}
        <div className="hidden w-48 shrink-0 lg:block">
          <nav className="sticky top-24 space-y-1">
            {tabsWithSettings.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}
