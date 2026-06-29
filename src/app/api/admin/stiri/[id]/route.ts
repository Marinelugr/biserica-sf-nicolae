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
  const { titleRo, titleRu, titleEn, slug, category, imageUrl, published, contentRo, contentRu, contentEn } = await req.json()

  try {
    const article = await prisma.article.update({
      where: { id },
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
    return NextResponse.json(article)
  } catch {
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

  const { id } = await params

  try {
    await prisma.article.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}
