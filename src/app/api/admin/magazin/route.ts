import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(products)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const { nameRo, price, descriptionRo, imageUrl, stock, category, active } = await req.json()
  if (!nameRo || price === undefined || price === '') {
    return NextResponse.json({ error: 'Numele și prețul sunt obligatorii' }, { status: 400 })
  }

  let slug = slugify(nameRo)
  const exists = await prisma.product.findUnique({ where: { slug } })
  if (exists) slug = `${slug}-${Date.now()}`

  const product = await prisma.product.create({
    data: {
      slug, nameRo, price: parseFloat(price),
      descriptionRo: descriptionRo || null,
      imageUrl: imageUrl || null,
      stock: stock !== undefined && stock !== '' ? parseInt(stock) : 0,
      category: category || null,
      active: active ?? true,
    },
  })
  return NextResponse.json(product, { status: 201 })
}
