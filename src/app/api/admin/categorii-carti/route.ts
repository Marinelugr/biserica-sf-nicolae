import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const cats = await prisma.bookCategory.findMany({ orderBy: { order: 'asc' } })
  return NextResponse.json(cats)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const { name, emoji, color } = await req.json()
  if (!name) return NextResponse.json({ error: 'Numele e obligatoriu' }, { status: 400 })
  const last = await prisma.bookCategory.findFirst({ orderBy: { order: 'desc' } })
  const cat = await prisma.bookCategory.create({
    data: { name, emoji: emoji || '📖', color: color || '#C9A84C', order: (last?.order ?? -1) + 1 },
  })
  return NextResponse.json(cat, { status: 201 })
}
