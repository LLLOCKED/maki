'use client'

import Link from 'next/link'
import { signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogIn, LogOut, User, Settings } from 'lucide-react'

interface AuthButtonProps {
  session: unknown
}

export default function AuthButton({ session }: AuthButtonProps) {
  const router = useRouter()
  const sessionUser = session as { user?: { id?: string; name?: string | null; image?: string | null } | null } | null

  if (sessionUser) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            {sessionUser.user?.name || 'Профіль'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/user/${sessionUser.user?.id}`}>
              <User className="mr-2 h-4 w-4" />
              Профіль
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              Налаштування
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/favorites">Вибране</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut()}
            className="text-destructive"
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
