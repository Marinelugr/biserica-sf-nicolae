import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const { id } = await params
  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Numele este obligatoriu' }, { status: 400 })
  const cat = await prisma.videoCategory.update({ where: { id }, data: { name: name.trim() } })
  return NextResponse.json(cat)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const { id } = await params
  await prisma.video.updateMany({ where: { categoryId: id }, data: { categoryId: null } })
  await prisma.videoCategory.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
