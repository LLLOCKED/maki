'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Menu, X, BookOpen, Plus, MessageSquare, Bookmark, User, Settings, LogOut, Bell, Heart, Clock } from 'lucide-react'
import AuthButton from './auth-button'
import SearchButton from './search-overlay'
import NotificationBell from './notification-bell'
import { cn } from '@/lib/utils'

interface NavbarProps {
  session: unknown
}

export default function Navbar({ session }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const sessionUser = session as { user?: { id?: string; name?: string | null; image?: string | null; role?: string } | null } | null
  const isAdmin = sessionUser?.user?.role && ['OWNER', 'ADMIN', 'MODERATOR'].includes(sessionUser.user.role)
  const navLinkClass = (href: string) => cn(
    'text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
    (pathname === href || pathname.startsWith(`${href}/`)) && 'text-foreground'
  )

  useEffect(() => {
    if (!isMenuOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isMenuOpen])

  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container relative mx-auto flex h-16 items-center justify-between gap-4 px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image src="/static/images/icon.png" alt="honni" width={32} height={32} className="shrink-0" priority />
            <span className="text-xl font-bold">honni</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="absolute left-1/2 hidden -translate-x-1/2 md:flex md:items-center md:gap-6">
            <Link href="/catalog" className={navLinkClass('/catalog')}>
              Каталог
            </Link>
            <Link href="/forum" className={navLinkClass('/forum')}>
              Форум
            </Link>
            {sessionUser?.user && (
              <Link href="/bookmarks" className={navLinkClass('/bookmarks')}>
                Закладки
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin" className={cn(navLinkClass('/admin'), 'text-primary')}>
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
                  href="/novels/new"
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
          <div className="fixed left-0 right-0 top-16 z-[60] h-[calc(100dvh-4rem)] border-t bg-background text-foreground md:hidden">
            <nav className="flex h-full flex-col gap-2 overflow-y-auto overscroll-contain px-4 py-6">
              <Link
                href="/catalog"
                className="flex w-full items-center gap-3 rounded-lg p-3 text-base font-medium hover:bg-muted"
                onClick={() => setIsMenuOpen(false)}
              >
                <BookOpen className="h-5 w-5" />
                Каталог
              </Link>
              {sessionUser?.user && (
                <>
                  <Link
                    href="/notifications"
                    className="flex w-full items-center gap-3 rounded-lg p-3 text-base font-medium hover:bg-muted"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Bell className="h-5 w-5" />
                    Сповіщення
                  </Link>
                  <Link
                    href="/history"
                    className="flex w-full items-center gap-3 rounded-lg p-3 text-base font-medium hover:bg-muted"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Clock className="h-5 w-5" />
                    Історія читання
                  </Link>
                  <Link
                    href="/bookmarks"
                    className="flex w-full items-center gap-3 rounded-lg p-3 text-base font-medium hover:bg-muted"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Bookmark className="h-5 w-5" />
                    Закладки
                  </Link>
                  <Link
                    href="/favorites"
                    className="flex w-full items-center gap-3 rounded-lg p-3 text-base font-medium hover:bg-muted"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Heart className="h-5 w-5" />
                    Улюблені
                  </Link>
                </>
              )}
              <Link
                href="/forum"
                className="flex w-full items-center gap-3 rounded-lg p-3 text-base font-medium hover:bg-muted"
                onClick={() => setIsMenuOpen(false)}
              >
                <MessageSquare className="h-5 w-5" />
                Форум
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex w-full items-center gap-3 rounded-lg p-3 text-base font-medium text-primary hover:bg-muted"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Адмінка
                </Link>
              )}
              <div className="mt-2 flex flex-col gap-2 border-t pt-4">
                {sessionUser?.user ? (
                  <>
                    <Link
                      href={`/user/${sessionUser.user.id}`}
                      className="flex w-full items-center gap-3 rounded-lg p-3 text-base font-medium hover:bg-muted"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="h-5 w-5" />
                      Профіль
                    </Link>
                    <Link
                      href="/settings"
                      className="flex w-full items-center gap-3 rounded-lg p-3 text-base font-medium hover:bg-muted"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings className="h-5 w-5" />
                      Редагування профілю
                    </Link>
                    <button
                      className="flex w-full items-center gap-3 rounded-lg p-3 text-base font-medium text-destructive hover:bg-muted"
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
                    className="flex w-full items-center gap-3 rounded-lg p-3 text-base font-medium hover:bg-muted"
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
