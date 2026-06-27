import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const { id } = await params
  const { time, serviceRo, serviceRu, notes } = await req.json()
  const slujba = await prisma.serviceSchedule.update({
    where: { id },
    data: { time, serviceRo, serviceRu: serviceRu || null, notes: notes || null },
  })
  return NextResponse.json(slujba)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const { id } = await params
  await prisma.serviceSchedule.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
