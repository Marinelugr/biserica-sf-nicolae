import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServerLocale, getServerT } from '@/lib/i18n/server'
import { parseChapterParam } from '@/lib/bible/nav'
import { BIBLE_SOURCE_NOTE } from '@/lib/bible/source'
import { chapterLabels } from '@/lib/bible/viewModel'
import PageShell from '@/components/shell/PageShell'
import ChapterView from '@/components/bible/ChapterView'
import { BOOK, CHAPTERS, sampleChapter } from '../_proba'

// Capitolele cărții de probă: 1 (primul, scurt), 2 (176 de versete), 3 (ultimul). Doar în dezvoltare.

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Galeria Bibliei — capitol (dezvoltare)', robots: { index: false, follow: false } }

export default async function BibleGalleryChapter({ params }: { params: Promise<{ capitol: string }> }) {
  if (process.env.NODE_ENV === 'production') notFound()
  const { capitol } = await params
  const n = parseChapterParam(capitol)
  if (!n || n > CHAPTERS) notFound()
  const [t, locale] = await Promise.all([getServerT(), getServerLocale()])

  return (
    <PageShell aside="compact">
      <ChapterView
        bookTitle={BOOK.title}
        chapter={n}
        count={CHAPTERS}
        verses={sampleChapter(n)}
        crumbs={[{ href: '/biblie', label: t.bible.title }, { href: '/dev/biblia', label: BOOK.title }, { label: `${t.bible.chapter} ${n}` }]}
        hrefFor={x => `/dev/biblia/${x}`}
        // la capete trece în „cartea vecină" (aici: înapoi la pagina cărții de probă)
        prevHref={n > 1 ? `/dev/biblia/${n - 1}` : '/dev/biblia'}
        nextHref={n < CHAPTERS ? `/dev/biblia/${n + 1}` : '/dev/biblia'}
        sourceNote={BIBLE_SOURCE_NOTE}
        langNote={locale === 'ro' ? undefined : t.bible.reader.langNote}
        labels={chapterLabels(t)}
      />
    </PageShell>
  )
}
