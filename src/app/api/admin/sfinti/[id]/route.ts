import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const { id } = await params
  const { nameRo, nameRu, nameEn, month, day, feastType, lifeRo, iconUrl } = await req.json()
  const saint = await prisma.saint.update({
    where: { id },
    data: {
      nameRo, nameRu: nameRu || null, nameEn: nameEn || null,
      month: parseInt(month), day: parseInt(day),
      feastType: feastType || null,
      lifeRo: lifeRo || null,
      iconUrl: iconUrl || null,
    },
  })
  return NextResponse.json(saint)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const { id } = await params
  await prisma.saint.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
