import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServerLocale, getServerT } from '@/lib/i18n/server'
import { localizedHref } from '@/lib/i18n/href'
import { bookLabel, getBook, neighbors } from '@/lib/bible/books'
import { chapterNav, chapterPath, parseChapterParam } from '@/lib/bible/nav'
import { getChapterCount, getChapterVerses } from '@/lib/bible/queries'
import { BIBLE_SOURCE_NOTE } from '@/lib/bible/source'
import { bibleChapterMetadata } from '@/lib/bible/seo'
import { bibleCrumbs, bookMeta, chapterLabels } from '@/lib/bible/viewModel'
import PageShell from '@/components/shell/PageShell'
import BookView from '@/components/bible/BookView'
import ChapterView from '@/components/bible/ChapterView'

export const dynamic = 'force-dynamic'

type Params = Promise<{ carte: string; capitol: string }>

async function load(carte: string, capitol: string) {
  const book = getBook(carte)
  const n = parseChapterParam(capitol)
  if (!book || n === null) return null
  const count = await getChapterCount(book.slug)
  // carte neimportată / bază indisponibilă → „în curând" (nu 404, nu 500)
  if (!count) return { book, n, count: 0, verses: [] as { n: number; text: string }[] }
  if (n > count) return null
  const verses = await getChapterVerses(book.slug, n)
  return { book, n, count, verses: verses ?? [] }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { carte, capitol } = await params
  const data = await load(carte, capitol)
  if (!data) return {}
  const [t, locale] = await Promise.all([getServerT(), getServerLocale()])
  return bibleChapterMetadata(data.book, data.n, t, locale, data.verses.length > 0)
}

export default async function BibleChapterPage({ params }: { params: Params }) {
  const { carte, capitol } = await params
  const data = await load(carte, capitol)
  if (!data) notFound()
  const [t, locale] = await Promise.all([getServerT(), getServerLocale()])
  const { book, n, count, verses } = data
  const r = t.bible.reader

  if (!count || !verses.length) {
    return (
      <PageShell aside="compact">
        <BookView
          title={bookLabel(book, locale)}
          meta={bookMeta(book, t)}
          crumbs={bibleCrumbs(t, locale, book)}
          count={0}
          hrefFor={x => localizedHref(`/biblie/${book.slug}/${x}`, locale)}
          labels={{ chapters: r.chapters, readFromStart: r.readFromStart, comingSoon: r.comingSoon, backToList: t.bible.title, backHref: localizedHref('/biblie', locale) }}
        />
      </PageShell>
    )
  }

  const prevBook = neighbors(book.slug).prev
  const prevBookCount = n === 1 && prevBook ? await getChapterCount(prevBook.slug) : null
  const nav = chapterNav(book.slug, n, count, prevBookCount)

  return (
    <PageShell aside="compact">
      <ChapterView
        bookTitle={bookLabel(book, locale)}
        chapter={n}
        count={count}
        verses={verses}
        crumbs={bibleCrumbs(t, locale, book, n)}
        hrefFor={x => localizedHref(`/biblie/${book.slug}/${x}`, locale)}
        prevHref={nav.prev ? localizedHref(chapterPath(nav.prev), locale) : null}
        nextHref={nav.next ? localizedHref(chapterPath(nav.next), locale) : null}
        sourceNote={BIBLE_SOURCE_NOTE}
        langNote={locale === 'ro' ? undefined : r.langNote}
        labels={chapterLabels(t)}
      />
    </PageShell>
  )
}
