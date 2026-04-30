'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { signOut } from 'next-auth/react'
import { Menu, X, BookOpen, Plus, Search, MessageSquare, Bookmark, User, Settings, LogOut, Bell, Heart, Clock } from 'lucide-react'
import AuthButton from './auth-button'
import SearchButton from './search-overlay'
import NotificationBell from './notification-bell'

interface NavbarProps {
  session: unknown
}

export default function Navbar({ session }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const sessionUser = session as { user?: { id?: string; name?: string | null; image?: string | null; role?: string } | null } | null
  const isAdmin = sessionUser?.user?.role && ['OWNER', 'ADMIN', 'MODERATOR'].includes(sessionUser.user.role)

  return (
    <>
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img src="/static/images/icon.png" alt="honni" width={32} height={32} className="shrink-0" />
            <span className="text-xl font-bold">honni</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-6">
            <Link href="/catalog" className="text-sm font-medium hover:text-primary">
              Каталог
            </Link>
            <Link href="/forum" className="text-sm font-medium hover:text-primary">
              Форум
            </Link>
            {sessionUser?.user && (
              <Link href="/bookmarks" className="text-sm font-medium hover:text-primary">
                Закладки
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin" className="text-sm font-medium hover:text-primary text-primary">
                Адмінка
              </Link>
            )}
            <SearchButton />
          </nav>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center gap-4">
            {sessionUser?.user && (
              <>
                <NotificationBell />
                <Link
                  href="/admin/novels/new"
                  className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  Додати
                </Link>
              </>
            )}

            <AuthButton session={session} />
            </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 top-16 z-50 border-t bg-background">
            <nav className="flex flex-col gap-2 px-4 py-6 h-full">
              <Link
                href="/catalog"
                className="flex items-center gap-3 text-base font-medium p-3 rounded-lg hover:bg-muted w-full"
                onClick={() => setIsMenuOpen(false)}
              >
                <BookOpen className="h-5 w-5" />
                Каталог
              </Link>
              {sessionUser?.user && (
                <>
                  <Link
                    href="/notifications"
                    className="flex items-center gap-3 text-base font-medium p-3 rounded-lg hover:bg-muted w-full"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Bell className="h-5 w-5" />
                    Сповіщення
                  </Link>
                  <Link
                    href="/history"
                    className="flex items-center gap-3 text-base font-medium p-3 rounded-lg hover:bg-muted w-full"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Clock className="h-5 w-5" />
                    Історія читання
                  </Link>
                  <Link
                    href="/bookmarks"
                    className="flex items-center gap-3 text-base font-medium p-3 rounded-lg hover:bg-muted w-full"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Bookmark className="h-5 w-5" />
                    Закладки
                  </Link>
                  <Link
                    href="/favorites"
                    className="flex items-center gap-3 text-base font-medium p-3 rounded-lg hover:bg-muted w-full"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Heart className="h-5 w-5" />
                    Улюблені
                  </Link>
                </>
              )}
              <Link
                href="/forum"
                className="flex items-center gap-3 text-base font-medium p-3 rounded-lg hover:bg-muted w-full"
                onClick={() => setIsMenuOpen(false)}
              >
                <MessageSquare className="h-5 w-5" />
                Форум
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-3 text-base font-medium p-3 rounded-lg hover:bg-muted w-full text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Адмінка
                </Link>
              )}
              <div className="flex flex-col gap-2 border-t mt-2 pt-4">
                {sessionUser?.user ? (
                  <>
                    <Link
                      href={`/user/${sessionUser.user.id}`}
                      className="flex items-center gap-3 text-base font-medium p-3 rounded-lg hover:bg-muted w-full"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="h-5 w-5" />
                      Профіль
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 text-base font-medium p-3 rounded-lg hover:bg-muted w-full"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings className="h-5 w-5" />
                      Редагування профілю
                    </Link>
                    <button
                      className="flex items-center gap-3 text-base font-medium p-3 rounded-lg hover:bg-muted w-full text-destructive"
                      onClick={() => {
                        setIsMenuOpen(false)
                        signOut({ callbackUrl: '/' })
                      }}
                    >
                      <LogOut className="h-5 w-5" />
                      Вийти
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="flex items-center gap-3 text-base font-medium p-3 rounded-lg hover:bg-muted w-full"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Увійти
                  </Link>
                )}
                    </div>
            </nav>
          </div>
        )}
      </header>
    </>
  )
}
