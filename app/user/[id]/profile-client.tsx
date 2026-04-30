'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { User, Users, Trophy, BookOpen, Settings, Star, MessageCircle, Shield, Heart } from 'lucide-react'

interface UserData {
  id: string
  name: string | null
  email: string | null
  image: string | null
  createdAt: Date
  teamMemberships: { id: string; role: string; team: { id: string; name: string; slug: string } }[]
  comments: { id: string; content: string; createdAt: Date; novel?: { slug: string; title: string }; chapter?: { number: number } }[]
  ratings: { id: string; value: number; createdAt: Date; novel: { id: string; slug: string; title: string; coverUrl: string | null } }[]
  favorites: { id: string; slug: string; title: string; coverUrl: string | null }[]
  novels: { id: string; slug: string; title: string; coverUrl: string | null; type: string; moderationStatus: string; authorId: string | null }[]
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
}: {
  user: UserData & { _count: { comments: number; ratings: number; favorites: number } }
  isOwn: boolean
}) {
  const [activeTab, setActiveTab] = useState('profile')
  const params = useParams()

  const tabsWithSettings = isOwn ? [...tabs, settingsTab] : tabs

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-full bg-muted">
                {user.image ? (
                  <img src={user.image} alt={user.name || ''} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <User className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{user.name || 'Користувач'}</h1>
                {isOwn && user.email && <p className="text-muted-foreground">{user.email}</p>}
                <p className="text-sm text-muted-foreground">На сайті з {new Date(user.createdAt).toLocaleDateString('uk-UA')}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
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

            {user.novels.length > 0 && (
              <div>
                <h2 className="mb-3 font-semibold">Авторські роботи</h2>
                <div className="grid grid-cols-3 gap-4">
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
                    <div className="flex items-center gap-3 rounded-lg border p-4 hover:bg-muted">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{membership.team.name}</p>
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
                <div className="flex items-center gap-4 rounded-lg border p-3 hover:bg-muted">
                  <div className="h-12 w-9 overflow-hidden rounded bg-muted">
                    {rating.novel.coverUrl ? (
                      <img src={rating.novel.coverUrl} alt={rating.novel.title} className="h-full w-full object-cover" />
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
          <div className="grid grid-cols-3 gap-4">
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
                <div className="mb-2 flex items-center gap-2 text-sm">
                  <Link href={`/novel/${comment.novel?.slug}`} className="font-medium hover:underline">
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-8">
        {/* Left content */}
        <div className="flex-1">
          {renderContent()}
        </div>

        {/* Right sidebar - Navigation */}
        <div className="w-48 shrink-0">
          <nav className="space-y-1">
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