import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServerLocale, getServerT } from '@/lib/i18n/server'
import { localizedHref } from '@/lib/i18n/href'
import { bookLabel, getBook } from '@/lib/bible/books'
import { getChapterCount } from '@/lib/bible/queries'
import { bibleBookMetadata } from '@/lib/bible/seo'
import { bibleCrumbs, bookMeta } from '@/lib/bible/viewModel'
import PageShell from '@/components/shell/PageShell'
import BookView from '@/components/bible/BookView'

export const dynamic = 'force-dynamic'

type Params = Promise<{ carte: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { carte } = await params
  const book = getBook(carte)
  if (!book) return {}
  const [t, locale, count] = await Promise.all([getServerT(), getServerLocale(), getChapterCount(carte)])
  return bibleBookMetadata(book, t, locale, Boolean(count))
}

export default async function BibleBookPage({ params }: { params: Params }) {
  const { carte } = await params
  const book = getBook(carte)
  if (!book) notFound()
  const [t, locale, count] = await Promise.all([getServerT(), getServerLocale(), getChapterCount(carte)])
  const r = t.bible.reader

  return (
    <PageShell aside="compact">
      <BookView
        title={bookLabel(book, locale)}
        meta={bookMeta(book, t)}
        crumbs={bibleCrumbs(t, locale, book)}
        count={count ?? 0}
        hrefFor={n => localizedHref(`/biblie/${book.slug}/${n}`, locale)}
        labels={{ chapters: r.chapters, readFromStart: r.readFromStart, comingSoon: r.comingSoon, backToList: t.bible.title, backHref: localizedHref('/biblie', locale) }}
      />
    </PageShell>
  )
}
