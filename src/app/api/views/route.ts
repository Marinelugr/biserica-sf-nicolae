import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  type: z.enum(['articol', 'video', 'carte']),
  id: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, id } = schema.parse(body)

    const data = { views: { increment: 1 } }
    const select = { views: true }

    const updated =
      type === 'articol' ? await prisma.article.update({ where: { id }, data, select }) :
      type === 'video' ? await prisma.video.update({ where: { id }, data, select }) :
      await prisma.libraryBook.update({ where: { id }, data, select })

    return NextResponse.json({ views: updated.views })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Date invalide', details: error.issues }, { status: 400 })
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Nu a fost găsit' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}
