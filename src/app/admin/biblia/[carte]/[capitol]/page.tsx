import { Fragment } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getBook } from '@/lib/bible/books'
import { requireBibleAdminPage } from '@/lib/bible/adminAuth'
import { missingVerseNumbers } from '@/lib/bible/adminCore'
import { loadChapterForEditor } from '@/lib/bible/adminQueries'
import { parseChapterParam } from '@/lib/bible/nav'
import { BibliaHeader, ui } from '@/components/admin/biblia/ui'
import { AddVerse, VerseEditor } from '@/components/admin/biblia/VerseEditor'

export const dynamic = 'force-dynamic'

export default async function AdminBibliaChapterPage({ params }: { params: Promise<{ carte: string; capitol: string }> }) {
  await requireBibleAdminPage()
  const { carte, capitol } = await params
  const book = getBook(carte)
  const n = parseChapterParam(capitol)
  if (!book || n === null) notFound()
  const data = await loadChapterForEditor(book.slug, n)
  if (!data) notFound()

  const numbers = data.verses.map(v => v.verseNum)
  const gaps = missingVerseNumbers(numbers)
  const next = Math.max(0, ...numbers) + 1
  const items = [
    ...data.verses.map(v => ({ n: v.verseNum, verse: v })),
    ...gaps.map(g => ({ n: g, verse: null })),
  ].sort((a, b) => a.n - b.n)

  const nav = (
    <nav aria-label="Capitole" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between', flexWrap: 'wrap', margin: '1rem 0' }}>
      {n > 1 ? <Link href={`/admin/biblia/${book.slug}/${n - 1}`} style={ui.ghost}>← Capitolul {n - 1}</Link> : <span />}
      {n < data.chapterCount ? <Link href={`/admin/biblia/${book.slug}/${n + 1}`} style={ui.ghost}>Capitolul {n + 1} →</Link> : <span />}
    </nav>
  )

  return (
    <>
      <BibliaHeader crumbs={[{ href: '/admin/biblia', label: 'Biblia' }, { href: `/admin/biblia/${book.slug}`, label: book.labelRo }, { label: `Capitolul ${n}` }]} />
      <h1 style={ui.h1}>{book.labelRo} — capitolul {n}</h1>
      <p style={ui.muted}>
        {data.verses.length} versete · {data.verses.filter(v => v.reviewed).length} revizuite
        {gaps.length > 0 && <strong style={{ ...ui.warn, marginLeft: '0.5rem' }}>Lipsesc: {gaps.join(', ')}</strong>}
      </p>
      {nav}
      <div style={{ display: 'grid', gap: '0.75rem', maxWidth: '860px' }}>
        {items.map(item => (
          <Fragment key={item.n}>
            {item.verse
              ? <VerseEditor verse={{ id: item.verse.id, n: item.n, text: item.verse.textRo, reviewed: item.verse.reviewed, editedAt: item.verse.editedAt?.toISOString() ?? null }} />
              : <AddVerse slug={book.slug} chapter={n} n={item.n} gap />}
          </Fragment>
        ))}
        <AddVerse key={`dupa-${next}`} slug={book.slug} chapter={n} n={next} gap={false} />
      </div>
      {nav}
    </>
  )
}
