import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const { id } = await params
  const { title, slug, url, platform, videoId, categoryId, description, startTime, endTime, isLive, archivedAt, serviceType } = await req.json()
  try {
    const video = await prisma.video.update({
      where: { id },
      data: {
        title: title?.trim(), slug: slug?.trim() || undefined, url: url?.trim(),
        platform: platform || 'youtube', videoId: videoId?.trim(),
        categoryId: categoryId || null,
        description: description || null,
        startTime: startTime !== undefined ? startTime : undefined,
        endTime: endTime !== undefined ? endTime : undefined,
        isLive: isLive !== undefined ? isLive : undefined,
        archivedAt: archivedAt !== undefined ? (archivedAt ? new Date(archivedAt) : null) : undefined,
        serviceType: serviceType !== undefined ? serviceType : undefined,
      },
      include: { category: { select: { id: true, name: true } } },
    })
    return NextResponse.json(video)
  } catch (err) {
    const e = err as { code?: string }
    if (e.code === 'P2002') return NextResponse.json({ error: 'Slug-ul există deja' }, { status: 409 })
    throw err
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const { id } = await params
  await prisma.video.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
