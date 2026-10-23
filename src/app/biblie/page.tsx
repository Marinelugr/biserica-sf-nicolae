import type { Metadata } from 'next'
import { getServerT, getServerLocale } from '@/lib/i18n/server'
import { pick } from '@/lib/i18n/pick'
import { buildAlternates } from '@/lib/i18n/alternates'
import { matchesAllWords } from '@/lib/search'
import { BIBLE_BOOKS } from '@/lib/bible/books'

import PageShell from '@/components/shell/PageShell'
import PageHead from '@/components/shell/PageHead'
import SearchForm from '@/components/shell/SearchForm'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT()
  return {
    title: t.meta.biblie.title,
    description: t.meta.biblie.description,
    alternates: buildAlternates('/biblie'),
  }
}

// Lista celor 80 de cărți stă în src/lib/bible/books.ts (folosită și de cititor și de import).
const VT_BOOKS = BIBLE_BOOKS.filter(b => b.testament === 'VT')
const NT_BOOKS = BIBLE_BOOKS.filter(b => b.testament === 'NT')

function matchesQuery(book: { labelRo: string; labelRu: string; labelEn: string }, query: string): boolean {
  return matchesAllWords(query, [book.labelRo, book.labelRu, book.labelEn])
}

export default async function BibliePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const [t, locale] = await Promise.all([getServerT(), getServerLocale()])
  const { q } = await searchParams
  const query = q?.trim() || ''

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

      {query && totalResults === 0 ? (
        <div className="card text-center">
          <span className="gold" style={{ fontSize: '44px' }} aria-hidden="true">☦</span>
          <p className="mt-3 text-[19px]">Nu s-au găsit rezultate pentru &ldquo;{query}&rdquo;</p>
          <p className="mute text-[16px] mt-2">Încercați un alt termen sau răsfoiți lista completă mai jos.</p>
          <a href="/biblie" className="btn mt-5">Vezi toate cărțile</a>
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
