import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const entityType = searchParams.get('entityType')
  const entityId = searchParams.get('entityId')

  if (!entityType || !entityId) {
    return NextResponse.json({ error: 'entityType și entityId sunt obligatorii' }, { status: 400 })
  }

  const items = await prisma.mediaItem.findMany({
    where: { entityType, entityId },
    orderBy: { order: 'asc' },
  })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

  const { url, caption, order, entityType, entityId } = await req.json()
  if (!url || !entityType || !entityId) {
    return NextResponse.json({ error: 'url, entityType și entityId sunt obligatorii' }, { status: 400 })
  }

  const item = await prisma.mediaItem.create({
    data: { url, caption: caption || null, order: order ?? 0, entityType, entityId },
  })
  return NextResponse.json(item, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

  const { items } = await req.json()
  if (!Array.isArray(items)) {
    return NextResponse.json({ error: 'items trebuie să fie un array' }, { status: 400 })
  }

  await Promise.all(
    items.map((item: { id: string; caption?: string; order: number }) =>
      prisma.mediaItem.update({
        where: { id: item.id },
        data: { caption: item.caption ?? null, order: item.order },
      })
    )
  )
  return NextResponse.json({ ok: true })
}
