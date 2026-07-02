import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

  const projects = await prisma.donationProject.findMany({ orderBy: { order: 'asc' } })
  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

  const { titleRo, titleRu, titleEn, descriptionRo, descriptionRu, descriptionEn, progress, target, active } = await req.json()
  if (!titleRo || !descriptionRo || !target) {
    return NextResponse.json({ error: 'Titlul, descrierea și ținta sunt obligatorii' }, { status: 400 })
  }

  const maxOrder = await prisma.donationProject.aggregate({ _max: { order: true } })

  const project = await prisma.donationProject.create({
    data: {
      titleRo,
      titleRu: titleRu || null,
      titleEn: titleEn || null,
      descriptionRo,
      descriptionRu: descriptionRu || null,
      descriptionEn: descriptionEn || null,
      progress: typeof progress === 'number' ? progress : 0,
      target,
      active: active ?? true,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  })
  return NextResponse.json(project, { status: 201 })
}
