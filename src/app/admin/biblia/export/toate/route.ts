import { NextResponse } from 'next/server'
import { requireBibleAdmin } from '@/lib/bible/adminAuth'
import { buildBookExport } from '@/lib/bible/adminCore'
import { BIBLE_BOOKS } from '@/lib/bible/books'
import { prisma } from '@/lib/prisma'
import { exportHeaders } from '../headers'

/** Un tablou de cărți, fiecare în formatul bible-data/<slug>.json. Numele începe cu „_”: importatorul îl ignoră. */
export async function GET() {
  if (!(await requireBibleAdmin())) return NextResponse.json({ error: 'Neautorizat' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  const rows = await prisma.bibleVerse.findMany({
    select: { verseNum: true, textRo: true, chapter: { select: { chapterNum: true, book: { select: { slug: true } } } } },
  })
  const bySlug = new Map<string, { chapterNum: number; verseNum: number; textRo: string }[]>()
  for (const r of rows) {
    const slug = r.chapter.book.slug
    const list = bySlug.get(slug) ?? []
    list.push({ chapterNum: r.chapter.chapterNum, verseNum: r.verseNum, textRo: r.textRo })
    bySlug.set(slug, list)
  }
  const books = BIBLE_BOOKS.filter(b => bySlug.has(b.slug)).map(b => buildBookExport(b.slug, bySlug.get(b.slug)!))
  return new Response(JSON.stringify(books, null, 2) + '\n', { headers: exportHeaders('_biblia-toate.json') })
}
