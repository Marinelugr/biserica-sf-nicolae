import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const categories = await prisma.videoCategory.findMany({
    orderBy: { order: 'asc' },
    include: { _count: { select: { videos: true } } },
  })
  return NextResponse.json(categories)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Numele este obligatoriu' }, { status: 400 })
  const last = await prisma.videoCategory.findFirst({ orderBy: { order: 'desc' } })
  let slug = slugify(name.trim())
  const exists = await prisma.videoCategory.findUnique({ where: { slug } })
  if (exists) slug = `${slug}-${Date.now()}`
  const cat = await prisma.videoCategory.create({ data: { name: name.trim(), slug, order: (last?.order ?? -1) + 1 } })
  return NextResponse.json(cat, { status: 201 })
}
