import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const { id } = await params
  const { name, emoji, color, order } = await req.json()
  const cat = await prisma.bookCategory.update({
    where: { id },
    data: { name, emoji, color, ...(order !== undefined ? { order } : {}) },
  })
  return NextResponse.json(cat)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const { id } = await params
  await prisma.libraryBook.updateMany({ where: { categoryId: id }, data: { categoryId: null } })
  await prisma.bookCategory.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
