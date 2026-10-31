import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getBook } from '@/lib/bible/books'
import { requireBibleAdminPage } from '@/lib/bible/adminAuth'
import { gapLabel } from '@/lib/bible/adminCore'
import { chapterStats, reviewedPercent, sumStats } from '@/lib/bible/adminQueries'
import { BibliaHeader, ui } from '@/components/admin/biblia/ui'

export const dynamic = 'force-dynamic'

export default async function AdminBibliaBookPage({ params }: { params: Promise<{ carte: string }> }) {
  await requireBibleAdminPage()
  const { carte } = await params
  const book = getBook(carte)
  if (!book) notFound()
  const chapters = await chapterStats(book.slug)
  const total = sumStats(chapters)

  return (
    <>
      <BibliaHeader crumbs={[{ href: '/admin/biblia', label: 'Biblia' }, { label: book.labelRo }]} />
      <h1 style={ui.h1}>{book.labelRo}</h1>
      <p style={ui.muted}>
        {total.chapters} capitole · {total.verses} versete · {reviewedPercent(total.reviewed, total.verses)}% revizuite · {gapLabel(total.gaps)} · {total.edited} editate
      </p>
      {chapters.length > 0 && (
        <p><a href={`/admin/biblia/export/${book.slug}`} style={ui.ghost}>Exportă cartea (JSON)</a></p>
      )}
      {chapters.length === 0 && <p style={ui.text}>Cartea nu este importată.</p>}
      <ul style={{ listStyle: 'none', margin: '1rem 0 0', padding: 0, display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))' }}>
        {chapters.map(c => {
          const complete = c.verses > 0 && c.reviewed === c.verses
          return (
            <li key={c.chapterNum}>
              <Link
                href={`/admin/biblia/${book.slug}/${c.chapterNum}`}
                style={{ ...ui.card, display: 'block', textAlign: 'center', padding: '0.5rem', height: '100%', boxSizing: 'border-box', borderColor: c.gaps ? '#E8B04A' : complete ? '#6FD86F' : '#2A1A0A' }}
              >
                <span style={{ ...ui.text, display: 'block', fontSize: '1.15rem' }}>{c.chapterNum}</span>
                {complete && <span style={{ ...ui.ok, display: 'block', fontSize: '0.8rem' }}>✓ revizuit</span>}
                {c.gaps > 0 && <span style={{ ...ui.warn, display: 'block', fontSize: '0.8rem' }}>{gapLabel(c.gaps)}</span>}
              </Link>
            </li>
          )
        })}
      </ul>
    </>
  )
}
