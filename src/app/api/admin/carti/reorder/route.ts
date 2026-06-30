import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const { items } = await req.json() as { items: { id: string; ordine: number }[] }
  if (!Array.isArray(items)) return NextResponse.json({ error: 'Format invalid' }, { status: 400 })
  await prisma.$transaction(
    items.map(({ id, ordine }) => prisma.libraryBook.update({ where: { id }, data: { ordine } }))
  )
  return NextResponse.json({ success: true })
}
