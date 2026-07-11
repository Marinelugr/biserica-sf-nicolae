import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const categoryId = searchParams.get('categoryId')
  const videos = await prisma.video.findMany({
    where: categoryId === 'none' ? { categoryId: null } : categoryId ? { categoryId } : undefined,
    include: { category: { select: { id: true, name: true } } },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  })
  return NextResponse.json(videos)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const { title, slug: slugInput, url, platform, videoId, categoryId, description, startTime, endTime, isLive, archivedAt, serviceType } = await req.json()
  if (!title?.trim() || !url?.trim() || !videoId?.trim()) {
    return NextResponse.json({ error: 'Titlul, URL-ul și videoId sunt obligatorii' }, { status: 400 })
  }
  const last = await prisma.video.findFirst({ orderBy: { order: 'desc' } })
  let slug = slugify(slugInput?.trim() || title.trim())
  const exists = await prisma.video.findUnique({ where: { slug } })
  if (exists) slug = `${slug}-${Date.now()}`
  try {
    const video = await prisma.video.create({
      data: {
        title: title.trim(), slug, url: url.trim(),
        platform: platform || 'youtube', videoId: videoId.trim(),
        categoryId: categoryId || null,
        description: description || null,
        order: (last?.order ?? -1) + 1,
        startTime: startTime ?? null,
        endTime: endTime ?? null,
        isLive: isLive ?? false,
        archivedAt: archivedAt ? new Date(archivedAt) : null,
        serviceType: serviceType || null,
      },
      include: { category: { select: { id: true, name: true } } },
    })
    return NextResponse.json(video, { status: 201 })
  } catch (err) {
    const e = err as { code?: string }
    if (e.code === 'P2002') return NextResponse.json({ error: 'Slug-ul există deja' }, { status: 409 })
    throw err
  }
}
