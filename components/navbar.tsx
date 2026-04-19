import Link from 'next/link'
import { auth } from '@/lib/auth'
import { BookOpen, Plus, Search, MessageSquare, Bookmark } from 'lucide-react'
import AuthButton from './auth-button'
import ThemeToggle from './theme-toggle'
import SearchButton from './search-overlay'

export default async function Navbar() {
  const session = await auth()

  return (
    <>
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold">maki</span>
          </Link>

          <nav className="absolute left-1/2 flex -translate-x-1/2 items-center gap-6">
            <Link href="/" className="text-sm font-medium hover:text-primary">
              Каталог
            </Link>
            {session && session.user && (
              <Link href="/bookmarks" className="text-sm font-medium hover:text-primary">
                Закладки
              </Link>
            )}
            <Link href="/forum" className="text-sm font-medium hover:text-primary">
              Форум
            </Link>
            <SearchButton />
          </nav>

          <div className="flex items-center gap-4">
            {session && session.user && (
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
        </div>
      </header>
    </>
  )
}
