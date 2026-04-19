'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { Menu, X, BookOpen, Plus, Search, MessageSquare, Bookmark, User, Settings, LogOut } from 'lucide-react'
import AuthButton from './auth-button'
import ThemeToggle from './theme-toggle'
import SearchButton from './search-overlay'

interface NavbarProps {
  session: unknown
}

export default function Navbar({ session }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const sessionUser = session as { user?: { id?: string; name?: string | null; image?: string | null } | null } | null

  return (
    <>
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold">honni</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-6">
            <Link href="/" className="text-sm font-medium hover:text-primary">
              Каталог
            </Link>
            {sessionUser?.user && (
              <Link href="/bookmarks" className="text-sm font-medium hover:text-primary">
                Закладки
              </Link>
            )}
            <Link href="/forum" className="text-sm font-medium hover:text-primary">
              Форум
            </Link>
            <SearchButton />
          </nav>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center gap-4">
            {sessionUser?.user && (
              <Link
                href="/admin/novels/new"
                className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Add title
              </Link>
            )}

            <AuthButton session={session} />

            <ThemeToggle />
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
          <div className="md:hidden border-t">
            <nav className="container mx-auto flex flex-col gap-4 px-4 py-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-sm font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                <BookOpen className="h-4 w-4" />
                Каталог
              </Link>
              {sessionUser?.user && (
                <Link
                  href="/bookmarks"
                  className="flex items-center gap-2 text-sm font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Bookmark className="h-4 w-4" />
                  Закладки
                </Link>
              )}
              <Link
                href="/forum"
                className="flex items-center gap-2 text-sm font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                <MessageSquare className="h-4 w-4" />
                Форум
              </Link>
              <div className="flex items-center gap-4 border-t pt-4">
                {sessionUser?.user ? (
                  <>
                    <Link
                      href={`/user/${sessionUser.user.id}`}
                      className="flex items-center gap-2 text-sm font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      Профіль
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 text-sm font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      Налаштування
                    </Link>
                    <button
                      className="flex items-center gap-2 text-sm font-medium text-destructive"
                      onClick={() => {
                        setIsMenuOpen(false)
                        signOut()
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Вийти
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="flex items-center gap-2 text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Увійти
                  </Link>
                )}
                <ThemeToggle />
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  )
}