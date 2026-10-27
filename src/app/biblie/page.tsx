import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerT, getServerLocale } from '@/lib/i18n/server'
import { pick } from '@/lib/i18n/pick'
import { buildAlternates } from '@/lib/i18n/alternates'
import { matchesAllWords } from '@/lib/search'
import { BIBLE_BOOKS, bookLabel, getBook } from '@/lib/bible/books'
import { parseReference } from '@/lib/bible/reference'
import { searchWords } from '@/lib/bible/search'
import { getChapterCount, searchVerses, SEARCH_PAGE_SIZE } from '@/lib/bible/queries'
import { fill } from '@/lib/bible/viewModel'
import { localizedHref } from '@/lib/i18n/href'
import VerseResults, { type VerseResultItem } from '@/components/bible/VerseResults'

import PageShell from '@/components/shell/PageShell'
import PageHead from '@/components/shell/PageHead'
import SearchForm from '@/components/shell/SearchForm'

export const dynamic = 'force-dynamic'

type Search = Promise<{ q?: string; pagina?: string }>

export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const [t, { q }] = await Promise.all([getServerT(), searchParams])
  return {
    title: t.meta.biblie.title,
    description: t.meta.biblie.description,
    alternates: buildAlternates('/biblie'),
    // paginile de rezultate ale căutării nu se indexează
    ...(q?.trim() ? { robots: { index: false, follow: false } } : {}),
  }
}

// Lista celor 80 de cărți stă în src/lib/bible/books.ts (folosită și de cititor și de import).
const VT_BOOKS = BIBLE_BOOKS.filter(b => b.testament === 'VT')
const NT_BOOKS = BIBLE_BOOKS.filter(b => b.testament === 'NT')

function matchesQuery(book: { labelRo: string; labelRu: string; labelEn: string }, query: string): boolean {
  return matchesAllWords(query, [book.labelRo, book.labelRu, book.labelEn])
}

export default async function BibliePage({ searchParams }: { searchParams: Search }) {
  const [t, locale] = await Promise.all([getServerT(), getServerLocale()])
  const { q, pagina } = await searchParams
  const query = q?.trim().slice(0, 100) || ''
  const r = t.bible.reader

  // „Ioan 3:16" → direct la verset; capitol peste numărul existent → pagina cărții
  const ref = query ? parseReference(query) : null
  if (ref?.chapter) {
    const count = await getChapterCount(ref.slug)
    if (count && ref.chapter <= count) {
      redirect(localizedHref(`/biblie/${ref.slug}/${ref.chapter}`, locale) + (ref.verse ? `#v${ref.verse}` : ''))
    }
    redirect(localizedHref(`/biblie/${ref.slug}`, locale))
  }

  // Versete: toate cuvintele (fără diacritice), 25 pe pagină
  const words = query ? searchWords(query) : []
  const page = Math.max(1, Math.min(1000, Number.parseInt(pagina || '1', 10) || 1))
  const verseSearch = words.length ? await searchVerses(words, page) : null
  const pages = verseSearch ? Math.max(1, Math.ceil(verseSearch.total / SEARCH_PAGE_SIZE)) : 1
  const pageHref = (n: number) => `${localizedHref('/biblie', locale)}?q=${encodeURIComponent(query)}${n > 1 ? `&pagina=${n}` : ''}`
  const verseItems: VerseResultItem[] = (verseSearch?.hits ?? []).map(h => {
    const book = getBook(h.slug)
    const name = book ? (locale === 'ro' ? book.aliases[0] : bookLabel(book, locale)) : h.slug
    return { href: `${localizedHref(`/biblie/${h.slug}/${h.chapter}`, locale)}#v${h.verse}`, reference: `${name} ${h.chapter}:${h.verse}`, text: h.text }
  })

  const vtNumbered = VT_BOOKS.map((book, i) => ({ ...book, num: i + 1 }))
  const ntNumbered = NT_BOOKS.map((book, i) => ({ ...book, num: VT_BOOKS.length + i + 1 }))

  const vtResults = query ? vtNumbered.filter(b => matchesQuery(b, query)) : vtNumbered
  const ntResults = query ? ntNumbered.filter(b => matchesQuery(b, query)) : ntNumbered
  const totalResults = vtResults.length + ntResults.length

  const bookList = (books: typeof vtResults, start?: number) => (
    <ol className="grid grid-cols-1 xl:grid-cols-2 gap-x-6" start={start}>
      {books.map(book => (
        <li key={book.slug} style={{ borderBottom: '1px solid var(--line)' }}>
          <a href={`/biblie/${book.slug}`} className="flex items-baseline gap-3 py-2.5 group">
            <span className="text-[14px] shrink-0 w-6 text-right mute">{book.num}</span>
            <span className="serif text-[20px] leading-snug group-hover:text-gold transition-colors">
              {pick(locale, book.labelRo, book.labelRu, book.labelEn)}
            </span>
          </a>
        </li>
      ))}
    </ol>
  )
  const testament = (title: string, subtitle: string, list: React.ReactNode) => (
    <section className="card" aria-label={title} data-reveal>
      <div className="sec-head">
        <h2 className="eyebrow" style={{ fontSize: 14 }}>{title}</h2>
        <p className="mute text-[15px]">{subtitle}</p>
      </div>
      {list}
    </section>
  )

  return (
    <PageShell aside="compact">
      <PageHead sec="evanghelie" eyebrow={t.bible.pageSubtitle} title={t.bible.title}>
        <div className="mt-2">
          <SearchForm action="/biblie" id="bible-search" placeholder={t.bible.searchPlaceholder} button={t.bible.searchBtn} defaultValue={query} />
        </div>
        {query && (
          <p className="mute text-[16px]">
            {totalResults > 0
              ? `${totalResults} ${totalResults === 1 ? 'carte găsită' : 'cărți găsite'} pentru „${query}"`
              : `Nu s-au găsit cărți pentru „${query}"`}
          </p>
        )}
      </PageHead>

      {verseSearch && verseSearch.total > 0 && (
        <VerseResults
          title={r.versesTitle}
          summary={fill(r.versesFound, { n: verseSearch.total })}
          items={verseItems}
          words={words}
          empty={r.noVerseResults}
          pager={{
            prevHref: page > 1 ? pageHref(page - 1) : null,
            nextHref: page < pages ? pageHref(page + 1) : null,
            label: fill(r.pageLabel, { n: page, total: pages }),
            prev: r.prevPage, next: r.nextPage,
          }}
        />
      )}

      {query && totalResults === 0 && !verseSearch?.total ? (
        <div className="card text-center">
          <span className="gold" style={{ fontSize: '44px' }} aria-hidden="true">☦</span>
          <p className="mt-3 text-[19px]">Nu s-au găsit rezultate pentru &ldquo;{query}&rdquo;</p>
          <p className="mute text-[16px] mt-2">Încercați un alt termen sau răsfoiți lista completă mai jos.</p>
          <Link href="/biblie" className="btn mt-5">Vezi toate cărțile</Link>
        </div>
      ) : (
        <>
          {vtResults.length > 0 && testament(t.bible.oldTestament, t.bible.oldTestamentBooks, bookList(vtResults))}
          {ntResults.length > 0 && testament(t.bible.newTestament, t.bible.newTestamentBooks, bookList(ntResults, 54))}
        </>
      )}

      <div className="card flex justify-center gap-10 text-center" style={{ padding: '20px 24px' }}>
        <div>
          <p className="h-m" style={{ color: 'var(--rose)' }}>53</p>
          <p className="mute text-[15px]">{t.bible.otBooksLabel}</p>
        </div>
        <div>
          <p className="h-m gold">27</p>
          <p className="mute text-[15px]">{t.bible.ntBooksLabel}</p>
        </div>
        <div>
          <p className="h-m">80</p>
          <p className="mute text-[15px]">{t.bible.totalLabel}</p>
        </div>
      </div>
    </PageShell>
  )
}
