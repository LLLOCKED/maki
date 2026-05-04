import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import ContentReportsList from '@/components/admin/content-reports-list'

export default async function AdminReportsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  if (!['OWNER', 'ADMIN', 'MODERATOR'].includes(session.user.role || '')) {
    notFound()
  }

  return <ContentReportsList />
}
