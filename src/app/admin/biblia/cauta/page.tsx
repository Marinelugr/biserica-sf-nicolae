import Link from 'next/link'
import { getBook } from '@/lib/bible/books'
import { requireBibleAdminPage } from '@/lib/bible/adminAuth'
import { SEARCH_PAGE_SIZE, searchVerses } from '@/lib/bible/queries'
import { highlightParts, searchWords } from '@/lib/bible/search'
import { BibliaHeader, Pager, pageParam, ui } from '@/components/admin/biblia/ui'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ q?: string | string[]; page?: string | string[] }>

export default async function AdminBibliaSearchPage({ searchParams }: { searchParams: SearchParams }) {
  await requireBibleAdminPage()
  const { q, page: rawPage } = await searchParams
  const query = (Array.isArray(q) ? q[0] : q ?? '').slice(0, 100)
  const page = pageParam(rawPage)
  const words = searchWords(query)
  const result = words.length ? await searchVerses(words, page) : null
  const pages = result ? Math.ceil(result.total / SEARCH_PAGE_SIZE) : 0

  return (
    <>
      <BibliaHeader crumbs={[{ href: '/admin/biblia', label: 'Biblia' }, { label: 'Caută' }]} />
      <h1 style={ui.h1}>Caută în text</h1>
      <form method="get" role="search" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem', maxWidth: '620px' }}>
        <div style={{ flex: '1 1 240px' }}>
          <label htmlFor="q" style={ui.label}>Cuvinte (fără diacritice merge la fel)</label>
          <input id="q" name="q" defaultValue={query} style={ui.input} />
        </div>
        <button type="submit" style={{ ...ui.button, alignSelf: 'flex-end' }}>Caută</button>
      </form>

      {query.trim() && !words.length && <p style={ui.muted}>Scrie cel puțin un cuvânt de două litere.</p>}
      {words.length > 0 && !result && <p role="alert" style={ui.error}>Căutarea nu a reușit; încearcă din nou.</p>}
      {result && <p role="status" style={ui.muted}>{result.total} versete găsite</p>}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.5rem', maxWidth: '860px' }}>
        {result?.hits.map(hit => {
          const label = getBook(hit.slug)?.labelRo ?? hit.slug
          return (
            <li key={`${hit.slug}/${hit.chapter}/${hit.verse}`} style={ui.card}>
              <Link href={`/admin/biblia/${hit.slug}/${hit.chapter}#v${hit.verse}`} style={{ color: '#C9A84C', fontFamily: 'Georgia, serif', textDecoration: 'underline' }}>
                {label} {hit.chapter}:{hit.verse} — editează
              </Link>
              <p style={{ ...ui.text, margin: '0.35rem 0 0' }}>
                {highlightParts(hit.text, words).map((p, i) => (p.hit ? <mark key={i} style={ui.mark}>{p.text}</mark> : <span key={i}>{p.text}</span>))}
              </p>
            </li>
          )
        })}
      </ul>
      <Pager page={page} pages={pages} href={p => `/admin/biblia/cauta?q=${encodeURIComponent(query)}&page=${p}`} />
    </>
  )
}
