import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { chisinauLocalToUTC } from '@/lib/chisinauTime'
import { normalizeSeoKeywords } from '@/lib/seo'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

  const { id } = await params
  const { titleRo, slug, category, imageUrl, published, scheduledFor, contentRo, seoKeywords } = await req.json()

  try {
    const article = await prisma.article.update({
      where: { id },
      data: {
        titleRo,
        slug,
        category: category || null,
        imageUrl: imageUrl || null,
        published: !!published,
        publishedAt: published ? new Date() : null,
        scheduledFor: scheduledFor ? chisinauLocalToUTC(scheduledFor) : null,
        contentRo: contentRo || '',
        seoKeywords: normalizeSeoKeywords(seoKeywords),
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
