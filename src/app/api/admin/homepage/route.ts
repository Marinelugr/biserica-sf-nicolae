import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { mergeHomepageWidgets } from '@/lib/homepageWidgets'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

  const widgets = await prisma.homepageWidget.findMany({ orderBy: { order: 'asc' } })
  return NextResponse.json(mergeHomepageWidgets(widgets))
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
