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
  const { titleRo, titleRu, titleEn, descriptionRo, descriptionRu, descriptionEn, progress, target, order, active } = await req.json()

  const project = await prisma.donationProject.update({
    where: { id },
    data: {
      ...(titleRo !== undefined && { titleRo }),
      ...(titleRu !== undefined && { titleRu: titleRu || null }),
      ...(titleEn !== undefined && { titleEn: titleEn || null }),
      ...(descriptionRo !== undefined && { descriptionRo }),
      ...(descriptionRu !== undefined && { descriptionRu: descriptionRu || null }),
      ...(descriptionEn !== undefined && { descriptionEn: descriptionEn || null }),
      ...(progress !== undefined && { progress }),
      ...(target !== undefined && { target }),
      ...(order !== undefined && { order }),
      ...(active !== undefined && { active }),
    },
  })
  return NextResponse.json(project)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  const { id } = await params
  await prisma.donationProject.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
