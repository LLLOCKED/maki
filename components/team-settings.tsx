'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

interface TeamSettingsProps {
  teamSlug: string
  currentAvatar?: string | null
  currentBanner?: string | null
}

export default function TeamSettings({ teamSlug, currentAvatar, currentBanner }: TeamSettingsProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentAvatar || null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(currentBanner || null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = () => setAvatarPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBannerFile(file)
      const reader = new FileReader()
      reader.onload = () => setBannerPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      let uploadedAvatarUrl: string | null = null
      let uploadedBannerUrl: string | null = null

      if (avatarFile) {
        const avatarFormData = new FormData()
        avatarFormData.append('file', avatarFile)
        avatarFormData.append('type', 'avatar')
        avatarFormData.append('teamSlug', teamSlug)

        const res = await fetch('/api/upload/team-image', {
          method: 'POST',
          body: avatarFormData,
        })

        if (!res.ok) {
          const data = await res.json()
          toast.error(data.error || 'Помилка завантаження аватарки')
          return
        }

        const data = await res.json()
        uploadedAvatarUrl = data.url
      }

      if (bannerFile) {
        const bannerFormData = new FormData()
        bannerFormData.append('file', bannerFile)
        bannerFormData.append('type', 'banner')
        bannerFormData.append('teamSlug', teamSlug)

        const res = await fetch('/api/upload/team-image', {
          method: 'POST',
          body: bannerFormData,
        })

        if (!res.ok) {
          const data = await res.json()
          toast.error(data.error || 'Помилка завантаження фону')
          return
        }

        const data = await res.json()
        uploadedBannerUrl = data.url
      }

      if (!avatarFile && !bannerFile) {
        toast.error('Оберіть зображення для завантаження')
        return
      }

      if (uploadedAvatarUrl) setAvatarPreview(uploadedAvatarUrl)
      if (uploadedBannerUrl) setBannerPreview(uploadedBannerUrl)
      setAvatarFile(null)
      setBannerFile(null)
      toast.success('Зображення завантажено')
      setIsOpen(false)
      router.refresh()
    } catch (error) {
      toast.error('Помилка завантаження')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setAvatarFile(null)
    setBannerFile(null)
    setAvatarPreview(currentAvatar ?? null)
    setBannerPreview(currentBanner ?? null)
    setIsOpen(false)
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <ImageIcon className="h-4 w-4 mr-2" />
        Налаштування
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Налаштування команди</DialogTitle>
            <DialogDescription>
              Завантажте аватарку та фон команди
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Avatar */}
            <div className="space-y-2">
              <Label>Аватарка</Label>
              <input
                type="file"
                accept="image/*"
                ref={avatarInputRef}
                onChange={handleAvatarSelect}
                className="hidden"
              />
              <div
                onClick={() => avatarInputRef.current?.click()}
                className="relative h-24 w-24 rounded-full border-2 border-dashed border-muted-foreground/50 cursor-pointer hover:border-primary transition-colors overflow-hidden group"
              >
                {avatarPreview ? (
                  <>
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Upload className="h-6 w-6 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              {avatarFile && (
                <p className="text-xs text-muted-foreground truncate">
                  {avatarFile.name}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                JPG, PNG, WebP. Макс. 5MB
              </p>
            </div>

            {/* Banner */}
            <div className="space-y-2">
              <Label>Фон</Label>
              <input
                type="file"
                accept="image/*"
                ref={bannerInputRef}
                onChange={handleBannerSelect}
                className="hidden"
              />
              <div
                onClick={() => bannerInputRef.current?.click()}
                className="relative h-40 w-full rounded-lg border-2 border-dashed border-muted-foreground/50 cursor-pointer hover:border-primary transition-colors overflow-hidden group"
              >
                {bannerPreview ? (
                  <>
                    <img
                      src={bannerPreview}
                      alt="Banner preview"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Upload className="h-6 w-6 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              {bannerFile && (
                <p className="text-xs text-muted-foreground truncate">
                  {bannerFile.name}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                JPG, PNG, WebP. Макс. 10MB
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Скасувати
            </Button>
            <Button onClick={handleSave} disabled={isLoading || (!avatarFile && !bannerFile)}>
              {isLoading ? 'Завантаження...' : 'Завантажити'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
