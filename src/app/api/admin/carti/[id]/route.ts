import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const { id } = await params
  const { titleRo, type, categoryId, contentRo, author, source, imageUrl, galleryUrls, videoUrl, videoTitle } = await req.json()
  const book = await prisma.libraryBook.update({
    where: { id },
    data: {
      titleRo, type,
      categoryId: categoryId || null,
      contentRo: contentRo || '',
      author: author || null,
      source: source || null,
      imageUrl: imageUrl || null,
      galleryUrls: galleryUrls || [],
      videoUrl: videoUrl || null,
      videoTitle: videoTitle || null,
    },
    include: { category: { select: { id: true, name: true, emoji: true, color: true } } },
  })
  return NextResponse.json(book)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const { id } = await params
  await prisma.libraryBook.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
