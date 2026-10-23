import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { MAX_MESSAGE_HTML } from '@/lib/priestMessage'
import { htmlToPlainText } from '@/lib/utils'

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

  // HTML din editor: `<p></p>` nu e un mesaj
  if (typeof mesajRo !== 'string' || !htmlToPlainText(mesajRo).trim()) {
    return NextResponse.json({ error: 'Mesajul (Română) este obligatoriu' }, { status: 400 })
  }
  if (mesajRo.length > MAX_MESSAGE_HTML) {
    return NextResponse.json({ error: 'Mesajul este prea lung (cel mult 30.000 de caractere cu formatare)' }, { status: 400 })
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
