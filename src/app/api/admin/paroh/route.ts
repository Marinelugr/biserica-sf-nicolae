import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

  const priest = await prisma.priest.findFirst()
  return NextResponse.json(priest)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

  const data = await req.json()
  const {
    nameRo, nameRu, nameEn, titleRo, titleRu, titleEn, photoUrl,
    bioRo, bioRu, bioEn, ordained, ordainedRu, ordainedEn,
    parish, parishRu, parishEn, education, educationRu, educationEn,
    phone, email, facebook,
  } = data

  if (!nameRo || !titleRo) {
    return NextResponse.json({ error: 'Numele și titlul sunt obligatorii' }, { status: 400 })
  }

  const payload = {
    nameRo, nameRu: nameRu || null, nameEn: nameEn || null,
    titleRo, titleRu: titleRu || null, titleEn: titleEn || null,
    photoUrl: photoUrl || null,
    bioRo: bioRo || null, bioRu: bioRu || null, bioEn: bioEn || null,
    ordained: ordained || null, ordainedRu: ordainedRu || null, ordainedEn: ordainedEn || null,
    parish: parish || null, parishRu: parishRu || null, parishEn: parishEn || null,
    education: education || null, educationRu: educationRu || null, educationEn: educationEn || null,
    phone: phone || null, email: email || null, facebook: facebook || null,
  }

  const existing = await prisma.priest.findFirst()

  let priest
  if (existing) {
    priest = await prisma.priest.update({ where: { id: existing.id }, data: payload })
  } else {
    priest = await prisma.priest.create({ data: payload })
  }

  return NextResponse.json(priest)
}
