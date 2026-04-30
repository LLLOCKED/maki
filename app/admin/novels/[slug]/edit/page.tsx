import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import NovelEditForm from '@/components/admin/novel-edit-form'

export default async function EditNovelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await auth()

  if (!session?.user?.id) {
    notFound()
  }

  const sessionWithRole = session as { user: { id: string; role?: string } }
  const role = sessionWithRole.user.role
  if (!['OWNER', 'ADMIN', 'MODERATOR'].includes(role || '')) {
    notFound()
  }

  const novel = await prisma.novel.findUnique({
    where: { slug },
    include: {
      genres: { include: { genre: true } },
      tags: { include: { tag: true } },
      publishers: { include: { publisher: true } },
      authors: { include: { author: true } },
    },
  })

  if (!novel) {
    notFound()
  }

  return <NovelEditForm novel={novel as any} />
}