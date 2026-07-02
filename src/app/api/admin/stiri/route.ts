import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

  const articles = await prisma.article.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(articles)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

  const { titleRo, titleRu, titleEn, slug, category, imageUrl, published, contentRo, contentRu, contentEn } = await req.json()

  if (!titleRo || !slug) {
    return NextResponse.json({ error: 'Titlul și slug-ul sunt obligatorii' }, { status: 400 })
  }

  try {
    const article = await prisma.article.create({
      data: {
        titleRo,
        titleRu: titleRu || null,
        titleEn: titleEn || null,
        slug,
        category: category || null,
        imageUrl: imageUrl || null,
        published: !!published,
        publishedAt: published ? new Date() : null,
        contentRo: contentRo || '',
        contentRu: contentRu || null,
        contentEn: contentEn || null,
      },
    })
    return NextResponse.json(article, { status: 201 })
  } catch (err) {
    const e = err as { code?: string }
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Slug-ul există deja' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}
