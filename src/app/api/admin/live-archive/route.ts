import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

const LIVE_CATEGORY_NAME = 'Sfânta Liturghie Live'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

  const { title, url, videoId, platform, serviceType } = await req.json()
  if (!title?.trim() || !videoId?.trim()) {
    return NextResponse.json({ error: 'Titlul și videoId sunt obligatorii' }, { status: 400 })
  }

  // Ensure the "Sfânta Liturghie Live" category exists
  let category = await prisma.videoCategory.findFirst({
    where: { name: LIVE_CATEGORY_NAME },
  })
  if (!category) {
    const last = await prisma.videoCategory.findFirst({ orderBy: { order: 'desc' } })
    let catSlug = slugify(LIVE_CATEGORY_NAME)
    if (await prisma.videoCategory.findUnique({ where: { slug: catSlug } })) catSlug = `${catSlug}-${Date.now()}`
    category = await prisma.videoCategory.create({
      data: { name: LIVE_CATEGORY_NAME, slug: catSlug, order: (last?.order ?? -1) + 1 },
    })
  }

  const last = await prisma.video.findFirst({ orderBy: { order: 'desc' } })
  let slug = slugify(title.trim())
  if (await prisma.video.findUnique({ where: { slug } })) slug = `${slug}-${Date.now()}`
  const video = await prisma.video.create({
    data: {
      title: title.trim(),
      slug,
      url: url?.trim() || `https://www.youtube.com/watch?v=${videoId}`,
      platform: platform || 'youtube',
      videoId: videoId.trim(),
      categoryId: category.id,
      isLive: true,
      archivedAt: new Date(),
      serviceType: serviceType || null,
      order: (last?.order ?? -1) + 1,
    },
    include: { category: { select: { id: true, name: true } } },
  })

  return NextResponse.json(video, { status: 201 })
}
