import { NextResponse } from 'next/server'
import { requireBibleAdmin } from '@/lib/bible/adminAuth'
import { loadBookExport } from '@/lib/bible/adminQueries'
import { getBook } from '@/lib/bible/books'
import { exportHeaders } from '../headers'

export async function GET(_req: Request, { params }: { params: Promise<{ carte: string }> }) {
  if (!(await requireBibleAdmin())) return NextResponse.json({ error: 'Neautorizat' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  const { carte } = await params
  const book = getBook(carte)
  const data = book ? await loadBookExport(book.slug) : null
  if (!data) return NextResponse.json({ error: 'Carte negăsită sau neimportată' }, { status: 404, headers: { 'Cache-Control': 'no-store' } })
  return new Response(JSON.stringify(data, null, 2) + '\n', { headers: exportHeaders(`${data.slug}.json`) })
}
