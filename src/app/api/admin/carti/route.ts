import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const books = await prisma.libraryBook.findMany({
    orderBy: { createdAt: 'desc' },
    include: { category: { select: { id: true, name: true, emoji: true, color: true } } },
  })
  return NextResponse.json(books)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const { titleRo, titleRu, titleEn, type, categoryId, contentRo, contentRu, contentEn, author, source, imageUrl, galleryUrls, videoUrl, videoTitle } = await req.json()
  if (!titleRo || !type) return NextResponse.json({ error: 'Titlul și tipul sunt obligatorii' }, { status: 400 })

  let slug = slugify(titleRo)
  const exists = await prisma.libraryBook.findUnique({ where: { slug } })
  if (exists) slug = `${slug}-${Date.now()}`

  try {
    const book = await prisma.libraryBook.create({
      data: {
        titleRo, titleRu: titleRu || null, titleEn: titleEn || null, slug, type,
        categoryId: categoryId || null,
        contentRo: contentRo || '',
        contentRu: contentRu || null,
        contentEn: contentEn || null,
        author: author || null,
        source: source || null,
        imageUrl: imageUrl || null,
        galleryUrls: galleryUrls || [],
        videoUrl: videoUrl || null,
        videoTitle: videoTitle || null,
      },
      include: { category: { select: { id: true, name: true, emoji: true, color: true } } },
    })
    return NextResponse.json(book, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}
