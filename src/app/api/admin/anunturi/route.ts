import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

/** Normalizează un input de dată (YYYY-MM-DD sau ISO) la o zi calendaristică, la miezul nopții UTC. */
function parseDateOnly(input: unknown): Date | null {
  if (typeof input !== 'string' || !input.trim()) return null
  const m = input.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return isNaN(d.getTime()) ? null : d
}

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const anunturi = await prisma.anunt.findMany({
    orderBy: [{ dataStart: 'desc' }, { createdAt: 'desc' }],
  })
  return NextResponse.json(anunturi)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

  const body = await req.json()
  const titlu = typeof body.titlu === 'string' ? body.titlu.trim() : ''
  const mesaj = typeof body.mesaj === 'string' ? body.mesaj.trim() : ''
  const zileAfisare = Number(body.zileAfisare)
  const dataStart = parseDateOnly(body.dataStart) ?? parseDateOnly(new Date().toISOString())!

  if (!titlu || !mesaj) {
    return NextResponse.json({ error: 'Titlul și mesajul sunt obligatorii' }, { status: 400 })
  }
  if (!Number.isFinite(zileAfisare) || zileAfisare < 1) {
    return NextResponse.json({ error: 'Numărul de zile de afișare trebuie să fie cel puțin 1' }, { status: 400 })
  }

  const anunt = await prisma.anunt.create({
    data: {
      titlu,
      mesaj,
      dataStart,
      zileAfisare: Math.round(zileAfisare),
      activ: body.activ === undefined ? true : !!body.activ,
    },
  })
  return NextResponse.json(anunt, { status: 201 })
}
