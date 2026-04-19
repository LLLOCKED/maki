import { auth } from '@/lib/auth'
import Link from 'next/link'
import ForumPageContent from '@/components/forum/forum-page-content'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Форум',
  description: 'Форум для обговорень, питань та пропозицій по ранобє та новелах',
}

export default async function ForumPage() {
  const session = await auth()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Форум</h1>
          <p className="text-muted-foreground">Обговорення, питання та пропозиції</p>
        </div>
        {session && (
          <Link
            href="/forum/new"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Нова тема
          </Link>
        )}
      </div>

      <ForumPageContent />
    </div>
  )
}
