import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServerT } from '@/lib/i18n/server'
import { fill } from '@/lib/bible/viewModel'
import { searchWords } from '@/lib/bible/search'
import PageShell from '@/components/shell/PageShell'
import BookView from '@/components/bible/BookView'
import VerseResults from '@/components/bible/VerseResults'
import { BOOK, CHAPTERS, sampleChapter } from './_proba'

/*
 * Galeria cititorului Bibliei — doar în dezvoltare, fără bază de date, doar text de probă.
 * Stările: pagina cărții (grila), „în curând", rezultate de căutare; capitolele în /dev/biblia/1..3.
 * În producție: 404. Nu apare în sitemap.ts; robots noindex.
 */

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Galeria Bibliei (dezvoltare)', robots: { index: false, follow: false } }

export default async function BibleGalleryPage() {
  if (process.env.NODE_ENV === 'production') notFound()
  const t = await getServerT()
  const r = t.bible.reader
  const crumbs = [{ href: '/biblie', label: t.bible.title }, { label: BOOK.title }]
  const words = searchWords('proba afisarii')
  const items = sampleChapter(1).slice(0, 3).map(v => ({ href: `/dev/biblia/1#v${v.n}`, reference: `Probă 1:${v.n}`, text: v.text }))

  return (
    <PageShell aside="compact">
      <BookView
        title={BOOK.title} meta={BOOK.meta} crumbs={crumbs} count={CHAPTERS}
        hrefFor={n => `/dev/biblia/${n}`}
        labels={{ chapters: r.chapters, readFromStart: r.readFromStart, comingSoon: r.comingSoon, backToList: t.bible.title, backHref: '/biblie' }}
      />
      <div data-stare="in-curand">
        <BookView
          title="Carte de probă fără text" meta={BOOK.meta} crumbs={crumbs} count={0}
          hrefFor={n => `/dev/biblia/${n}`}
          labels={{ chapters: r.chapters, readFromStart: r.readFromStart, comingSoon: r.comingSoon, backToList: t.bible.title, backHref: '/biblie' }}
        />
      </div>
      <VerseResults
        title={r.versesTitle} summary={fill(r.versesFound, { n: 53 })} items={items} words={words} empty={r.noVerseResults}
        pager={{ prevHref: null, nextHref: '/dev/biblia?pagina=2', label: fill(r.pageLabel, { n: 1, total: 3 }), prev: r.prevPage, next: r.nextPage }}
      />
    </PageShell>
  )
}
