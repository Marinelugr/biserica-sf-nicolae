import Link from 'next/link'
import { BIBLE_BOOKS } from '@/lib/bible/books'
import { requireBibleAdminPage } from '@/lib/bible/adminAuth'
import { gapLabel } from '@/lib/bible/adminCore'
import { chapterStats, reviewedPercent, sumStats, type ChapterStats } from '@/lib/bible/adminQueries'
import { normalizeForSearch } from '@/lib/bible/search'
import { BibliaHeader, ui } from '@/components/admin/biblia/ui'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ q?: string | string[] }>

export default async function AdminBibliaPage({ searchParams }: { searchParams: SearchParams }) {
  await requireBibleAdminPage()
  const { q } = await searchParams
  const query = (Array.isArray(q) ? q[0] : q ?? '').slice(0, 100).trim()
  const needle = normalizeForSearch(query).trim()

  const byBook = new Map<string, ChapterStats[]>()
  for (const row of await chapterStats()) {
    const list = byBook.get(row.slug)
    if (list) list.push(row)
    else byBook.set(row.slug, [row])
  }
  const books = BIBLE_BOOKS.map(book => ({ book, stats: sumStats(byBook.get(book.slug) ?? []) }))
  const totals = sumStats([...byBook.values()].flat())
  const visible = needle
    ? books.filter(({ book }) => [book.labelRo, ...book.aliases].some(name => normalizeForSearch(name).includes(needle)))
    : books

  return (
    <>
      <BibliaHeader crumbs={[{ label: 'Biblia' }]} />
      <h1 style={ui.h1}>Biblia</h1>
      <p style={ui.muted}>
        {totals.verses} versete în {totals.chapters} capitole · {reviewedPercent(totals.reviewed, totals.verses)}% revizuite · {gapLabel(totals.gaps)} · {totals.edited} editate
      </p>
      <form method="get" role="search" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '1rem 0', maxWidth: '520px' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label htmlFor="q" style={ui.label}>Caută cartea după nume</label>
          <input id="q" name="q" defaultValue={query} style={ui.input} />
        </div>
        <button type="submit" style={{ ...ui.ghost, alignSelf: 'flex-end' }}>Caută</button>
      </form>
      <p style={{ margin: '0 0 1rem' }}>
        {/* descărcare dintr-un route handler, nu o pagină */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/admin/biblia/export/toate" style={ui.ghost}>Exportă toate cărțile (JSON)</a>
      </p>

      {visible.length === 0 && <p style={ui.text}>Nicio carte găsită.</p>}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))' }}>
        {visible.map(({ book, stats }) => (
          <li key={book.slug}>
            <Link href={`/admin/biblia/${book.slug}`} style={{ ...ui.card, display: 'block', height: '100%', boxSizing: 'border-box' }}>
              <span style={{ ...ui.text, display: 'block', marginBottom: '0.25rem' }}>{book.labelRo}</span>
              <span style={{ ...ui.muted, display: 'block' }}>
                {stats.chapters
                  ? `${stats.chapters} cap. · ${stats.verses} versete · ${reviewedPercent(stats.reviewed, stats.verses)}% revizuite · ${stats.edited} editate`
                  : 'Neimportată'}
              </span>
              {stats.gaps > 0 && <span style={{ ...ui.warn, display: 'block' }}>{gapLabel(stats.gaps)}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
