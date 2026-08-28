import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

  const mesaj = await prisma.priestMessage.findFirst()
  return NextResponse.json(mesaj)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

  const data = await req.json()
  const { photoUrl, mesajRo, semnaturaRo, active } = data

  if (!mesajRo) {
    return NextResponse.json({ error: 'Mesajul (Română) este obligatoriu' }, { status: 400 })
  }

  const payload = {
    photoUrl: photoUrl || null,
    mesajRo,
    semnaturaRo: semnaturaRo || 'Pr. Marin Grigoriță, Parohul Bisericii',
    active: active ?? true,
  }

  const existing = await prisma.priestMessage.findFirst()

  let mesaj
  if (existing) {
    mesaj = await prisma.priestMessage.update({ where: { id: existing.id }, data: payload })
  } else {
    mesaj = await prisma.priestMessage.create({ data: payload })
  }

  return NextResponse.json(mesaj)
}
