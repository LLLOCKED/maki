import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import ProfileSettings from '@/components/settings/profile-settings'

export default async function SettingsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/')
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Редагування профілю</h1>

      <div className="space-y-6">
        {/* Profile Settings */}
        <ProfileSettings />
      </div>
    </div>
  )
}