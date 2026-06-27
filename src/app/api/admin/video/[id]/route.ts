import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const { id } = await params
  const { title, url, platform, videoId, categoryId, description } = await req.json()
  const video = await prisma.video.update({
    where: { id },
    data: {
      title: title?.trim(), url: url?.trim(),
      platform: platform || 'youtube', videoId: videoId?.trim(),
      categoryId: categoryId || null,
      description: description || null,
    },
    include: { category: { select: { id: true, name: true } } },
  })
  return NextResponse.json(video)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const { id } = await params
  await prisma.video.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
