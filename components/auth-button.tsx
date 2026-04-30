'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bookmark, Clock, LogIn, LogOut, Settings, User } from 'lucide-react'

interface AuthButtonProps {
  session: unknown
}

export default function AuthButton({ session }: AuthButtonProps) {
  const router = useRouter()
  const sessionUser = session as { user?: { id?: string; name?: string | null; image?: string | null } | null } | null

  if (sessionUser?.user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 rounded-full">
            {sessionUser.user.image ? (
              <img
                src={sessionUser.user.image}
                alt=""
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
            )}
            <span className="hidden md:inline">{sessionUser.user.name || 'Профіль'}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="flex items-center justify-start gap-3 p-3">
            {sessionUser.user.image ? (
              <img
                src={sessionUser.user.image}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
            )}
            <div className="flex flex-col space-y-1 leading-none">
              <p className="font-medium">{sessionUser.user.name || 'Користувач'}</p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href={`/user/${sessionUser.user?.id}`} className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Профіль
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/bookmarks" className="flex items-center gap-2">
              <Bookmark className="h-4 w-4" />
              Закладки
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/history" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Історія
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Налаштування
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: '/' })}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Вийти
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Button onClick={() => router.push('/login')} size="sm" className="gap-2">
      <LogIn className="h-4 w-4" />
      Увійти
    </Button>
  )
}
