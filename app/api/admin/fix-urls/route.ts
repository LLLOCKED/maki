import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthResponse, requireOwner } from '@/lib/permissions'

export async function POST() {
  const session = await requireOwner()
  if (isAuthResponse(session)) return session

  try {
    // Fix novel coverUrls
    const novelsResult = await prisma.$executeRaw`
      UPDATE "Novel"
      SET "coverUrl" = REPLACE("coverUrl", '/uploads/posters/', 'https://edge-drive.cdn.express/posters/')
      WHERE "coverUrl" LIKE '/uploads/posters/%'
    `

    // Fix user images
    const usersResult = await prisma.$executeRaw`
      UPDATE "User"
      SET "image" = REPLACE("image", '/uploads/avatars/', 'https://edge-drive.cdn.express/avatars/')
      WHERE "image" LIKE '/uploads/avatars/%'
    `

    return NextResponse.json({
      success: true,
      novelsUpdated: novelsResult,
      usersUpdated: usersResult,
    })
  } catch (error) {
    console.error('Error fixing URLs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
