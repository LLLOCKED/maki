'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPlus, X, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Member {
  id: string
  role: string
  user: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  }
}

interface SearchUser {
  id: string
  name: string | null
  image: string | null
}

interface AddTeamMemberProps {
  teamId: string
  currentUserId: string
  members: Member[]
  isOwner: boolean
  isAdmin: boolean
}

export default function AddTeamMember({
  teamId,
  currentUserId,
  members,
  isOwner,
  isAdmin,
}: AddTeamMemberProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null)
  const [role, setRole] = useState('member')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const canAddMember = isOwner || isAdmin
  const canRemoveMember = isOwner

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSearchResults([])
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search users by name
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`)
        if (res.ok) {
          const users = await res.json()
          // Filter out already team members
          const memberIds = members.map((m) => m.user.id)
          setSearchResults(users.filter((u: SearchUser) => !memberIds.includes(u.id)))
        }
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery, members])

  const handleSelectUser = (user: SearchUser) => {
    setSelectedUser(user)
    setSearchQuery(user.name || '')
    setSearchResults([])
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, role }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Помилка при додаванні учасника')
        return
      }

      setSuccess('Учасника додано')
      setSearchQuery('')
      setSelectedUser(null)
      router.refresh()
    } catch (err) {
      setError('Помилка при додаванні учасника')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Видалити цього учасника з команди?')) return

    try {
      const res = await fetch(`/api/teams/${teamId}/members?userId=${userId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Помилка при видаленні')
        return
      }

      router.refresh()
    } catch (err) {
      alert('Помилка при видаленні учасника')
    }
  }

  return (
    <div className="space-y-4">
      {canAddMember && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="h-5 w-5" />
              Додати учасника
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddMember} className="space-y-3">
              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Введіть ім&apos;я користувача"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setSelectedUser(null)
                    }}
                    className="pl-9"
                  />
                </div>

                {/* Search results dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-md">
                    {searchResults.map((user) => (
                      <div key={user.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted">
                        <Link
                          href={`/user/${user.id}`}
                          className="flex flex-1 items-center gap-3"
                          onClick={(e) => {
                            e.preventDefault()
                            handleSelectUser(user)
                          }}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            {user.image ? (
                              <img
                                src={user.image}
                                alt={user.name || ''}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-medium">
                                {user.name?.[0] || '?'}
                              </span>
                            )}
                          </div>
                          <span>{user.name || 'Користувач'}</span>
                        </Link>
                        <Link
                          href={`/user/${user.id}`}
                          className="text-xs text-muted-foreground hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          відкрити
                        </Link>
                      </div>
                    ))}
                  </div>
                )}

                {isSearching && searchQuery.length >= 2 && (
                  <div className="mt-1 px-3 py-2 text-sm text-muted-foreground">
                    Пошук...
                  </div>
                )}
              </div>

              {selectedUser && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Вибраний: {selectedUser.name || 'Користувач'}</Badge>
                </div>
              )}

              <div className="flex gap-2">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="member">Учасник</option>
                  <option value="admin">Адмін</option>
                </select>
                <Button type="submit" disabled={!selectedUser || isLoading}>
                  {isLoading ? '...' : 'Додати'}
                </Button>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              {success && (
                <p className="text-sm text-green-600">{success}</p>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                {member.user.image ? (
                  <img
                    src={member.user.image}
                    alt={member.user.name || ''}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-medium">
                    {member.user.name?.[0] || '?'}
                  </span>
                )}
              </div>
              <div>
                <p className="font-medium">
                  {member.user.name || 'Користувач'}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {member.role === 'owner'
                      ? 'Власник'
                      : member.role === 'admin'
                      ? 'Адмін'
                      : 'Учасник'}
                  </Badge>
                  {member.user.id === currentUserId && (
                    <span className="text-xs text-muted-foreground">(вы)</span>
                  )}
                </div>
              </div>
            </div>

            {canRemoveMember &&
              member.role !== 'owner' &&
              member.user.id !== currentUserId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveMember(member.user.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
          </div>
        ))}
      </div>
    </div>
  )
}
