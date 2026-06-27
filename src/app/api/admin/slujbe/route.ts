import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
  const slujbe = await prisma.serviceSchedule.findMany({
    where: { year, month },
    orderBy: [{ day: 'asc' }, { time: 'asc' }],
  })
  return NextResponse.json(slujbe)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const body = await req.json()

  // Bulk copy: { copyFrom: { year, month }, copyTo: { year, month } }
  if (body.copyFrom) {
    const { copyFrom, copyTo } = body
    const source = await prisma.serviceSchedule.findMany({
      where: { year: copyFrom.year, month: copyFrom.month },
    })
    if (source.length === 0) return NextResponse.json({ error: 'Luna sursă nu are slujbe' }, { status: 400 })
    const created = await prisma.serviceSchedule.createMany({
      data: source.map(s => ({ year: copyTo.year, month: copyTo.month, day: s.day, time: s.time, serviceRo: s.serviceRo, serviceRu: s.serviceRu, notes: s.notes })),
    })
    return NextResponse.json({ count: created.count }, { status: 201 })
  }

  const { year, month, day, time, serviceRo, serviceRu, notes } = body
  if (!year || !month || !day || !time || !serviceRo) {
    return NextResponse.json({ error: 'Anul, luna, ziua, ora și slujba sunt obligatorii' }, { status: 400 })
  }
  const slujba = await prisma.serviceSchedule.create({
    data: { year: parseInt(year), month: parseInt(month), day: parseInt(day), time, serviceRo, serviceRu: serviceRu || null, notes: notes || null },
  })
  return NextResponse.json(slujba, { status: 201 })
}
