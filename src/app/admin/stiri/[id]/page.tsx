import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import EditArticolClient from './EditArticolClient'

export default async function EditArticolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const article = await prisma.article.findUnique({ where: { id } })
  if (!article) notFound()
  return <EditArticolClient article={article} />
}
