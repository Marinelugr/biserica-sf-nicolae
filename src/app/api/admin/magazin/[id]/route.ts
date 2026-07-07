import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const { id } = await params
  const { nameRo, price, descriptionRo, imageUrl, stock, category, active } = await req.json()
  const product = await prisma.product.update({
    where: { id },
    data: {
      nameRo, price: parseFloat(price),
      descriptionRo: descriptionRo || null,
      imageUrl: imageUrl || null,
      stock: stock !== undefined && stock !== '' ? parseInt(stock) : 0,
      category: category || null,
      active: active ?? true,
    },
  })
  return NextResponse.json(product)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const { id } = await params
  await prisma.product.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
