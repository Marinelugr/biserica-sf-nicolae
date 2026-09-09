import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

function parseDateOnly(input: unknown): Date | null {
  if (typeof input !== 'string' || !input.trim()) return null
  const m = input.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return isNaN(d.getTime()) ? null : d
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  const data: Record<string, unknown> = {}

  if (body.titlu !== undefined) {
    const titlu = typeof body.titlu === 'string' ? body.titlu.trim() : ''
    if (!titlu) return NextResponse.json({ error: 'Titlul nu poate fi gol' }, { status: 400 })
    data.titlu = titlu
  }
  if (body.mesaj !== undefined) {
    const mesaj = typeof body.mesaj === 'string' ? body.mesaj.trim() : ''
    if (!mesaj) return NextResponse.json({ error: 'Mesajul nu poate fi gol' }, { status: 400 })
    data.mesaj = mesaj
  }
  if (body.zileAfisare !== undefined) {
    const z = Number(body.zileAfisare)
    if (!Number.isFinite(z) || z < 1) {
      return NextResponse.json({ error: 'Numărul de zile de afișare trebuie să fie cel puțin 1' }, { status: 400 })
    }
    data.zileAfisare = Math.round(z)
  }
  if (body.dataStart !== undefined) {
    const d = parseDateOnly(body.dataStart)
    if (!d) return NextResponse.json({ error: 'Dată de început invalidă' }, { status: 400 })
    data.dataStart = d
  }
  if (body.activ !== undefined) data.activ = !!body.activ

  const anunt = await prisma.anunt.update({ where: { id }, data })
  return NextResponse.json(anunt)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const { id } = await params
  await prisma.anunt.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
