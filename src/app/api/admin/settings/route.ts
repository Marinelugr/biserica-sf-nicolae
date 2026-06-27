import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')
  if (!key) return NextResponse.json({ error: 'key este obligatoriu' }, { status: 400 })
  const setting = await prisma.setting.findUnique({ where: { key } })
  if (!setting) return NextResponse.json(null)
  try {
    return NextResponse.json(JSON.parse(setting.value))
  } catch {
    return NextResponse.json(setting.value)
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const { key, value } = await req.json()
  if (!key) return NextResponse.json({ error: 'key este obligatoriu' }, { status: 400 })
  await prisma.setting.upsert({
    where: { key },
    update: { value: typeof value === 'string' ? value : JSON.stringify(value) },
    create: { key, value: typeof value === 'string' ? value : JSON.stringify(value) },
  })
  return NextResponse.json({ success: true })
}
