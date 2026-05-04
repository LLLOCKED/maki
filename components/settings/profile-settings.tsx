'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { User, Upload, Loader2, X } from 'lucide-react'
import { DEFAULT_AVATAR_URL } from '@/lib/default-avatar'

function extractFTPPath(url: string): { filename: string; folder: string } | null {
  if (!url || !url.includes('edge-drive.cdn.express')) return null
  const match = url.match(/\/avatars\/(.+)$/)
  if (!match) return null
  return { filename: match[1], folder: 'avatars' }
}

export default function ProfileSettings() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [name, setName] = useState(session?.user?.name || '')
  const [avatarUrl, setAvatarUrl] = useState(session?.user?.image || DEFAULT_AVATAR_URL)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const originalAvatarUrl = session?.user?.image || DEFAULT_AVATAR_URL

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Upload failed')
        return
      }

      const data = await res.json()
      setAvatarUrl(data.url)
    } catch (err) {
      setError('Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarUrl(DEFAULT_AVATAR_URL)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, image: avatarUrl }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Не вдалось оновити профіль')
        toast.error(data.error || 'Не вдалось оновити профіль')
        return
      }

      // Delete old avatar if it changed and was hosted on FTP
      if (avatarUrl !== originalAvatarUrl && originalAvatarUrl) {
        const oldPath = extractFTPPath(originalAvatarUrl)
        if (oldPath) {
          await fetch('/api/upload/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(oldPath),
          })
        }
      }

      await update({ name, image: avatarUrl })
      router.refresh()
      toast.success('Профіль оновлено')
    } catch (err) {
      setError('Не вдалось оновити профіль')
      toast.error('Не вдалось оновити профіль')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Профіль
        </CardTitle>
        <CardDescription>Зміна імені та аватара</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Avatar preview and upload */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-muted">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2 w-full">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Завантажити
                </Button>
                {avatarUrl && avatarUrl !== DEFAULT_AVATAR_URL && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveAvatar}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Видалити
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, GIF або WebP до 2MB
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="name">Ім&apos;я</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ваше ім'я"
              maxLength={50}
            />
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Зберегти
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
