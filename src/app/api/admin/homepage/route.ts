import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const DEFAULT_WIDGETS = [
  { section: 'sfintii_zilei',     order: 0, enabled: true },
  { section: 'evanghelia_zilei',  order: 1, enabled: true },
  { section: 'rugaciunea_zilei',  order: 2, enabled: true },
  { section: 'program_slujbe',    order: 3, enabled: true },
  { section: 'stiri_recente',     order: 4, enabled: true },
  { section: 'biblioteca_ortodoxa', order: 5, enabled: true },
]

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

  const widgets = await prisma.homepageWidget.findMany({ orderBy: { order: 'asc' } })

  if (widgets.length === 0) return NextResponse.json(DEFAULT_WIDGETS)
  return NextResponse.json(widgets)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

  const widgets: { section: string; enabled: boolean; order: number }[] = await req.json()

  await Promise.all(
    widgets.map(w =>
      prisma.homepageWidget.upsert({
        where: { section: w.section },
        update: { enabled: w.enabled, order: w.order },
        create: { section: w.section, enabled: w.enabled, order: w.order },
      })
    )
  )

  return NextResponse.json({ success: true })
}
