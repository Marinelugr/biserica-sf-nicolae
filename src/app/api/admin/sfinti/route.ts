import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')
  const saints = await prisma.saint.findMany({
    where: month ? { month: parseInt(month) } : undefined,
    orderBy: [{ month: 'asc' }, { day: 'asc' }],
  })
  return NextResponse.json(saints)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const { nameRo, nameRu, nameEn, month, day, feastType, lifeRo, iconUrl } = await req.json()
  if (!nameRo || !month || !day) return NextResponse.json({ error: 'Nume, lună și zi sunt obligatorii' }, { status: 400 })

  let slug = `sf-${slugify(nameRo)}-${month}-${day}`
  const exists = await prisma.saint.findUnique({ where: { slug } })
  if (exists) slug = `${slug}-${Date.now()}`

  const saint = await prisma.saint.create({
    data: {
      nameRo, nameRu: nameRu || null, nameEn: nameEn || null,
      month: parseInt(month), day: parseInt(day),
      feastType: feastType || null,
      lifeRo: lifeRo || null,
      iconUrl: iconUrl || null,
      slug,
    },
  })
  return NextResponse.json(saint, { status: 201 })
}
