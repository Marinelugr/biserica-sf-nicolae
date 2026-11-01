import PageHead from '@/components/shell/PageHead'
import ChapterGrid from './ChapterGrid'
import ReaderControls from './ReaderControls'
import { ReportNote, VerseReportLayer } from './VerseReportLayer'

export interface ChapterViewProps {
  bookTitle: string
  chapter: number
  count: number
  verses: { n: number; text: string }[]
  crumbs: { href?: string; label: string }[]
  hrefFor: (n: number) => string
  prevHref: string | null
  nextHref: string | null
  sourceNote: string
  /** Pe ru/en: „Textul Bibliei este în limba română." */
  langNote?: string
  /** Cartea, pentru raportarea greșelilor. Lipsește în galeria de dezvoltare, unde versetele sunt inventate. */
  reportSlug?: string
  labels: {
    chapter: string; chapters: string; chooseChapter: string; prevChapter: string; nextChapter: string
    textSize: string; sizes: [string, string, string]
  }
}

function ChapterNav({ prevHref, nextHref, labels, position }: Pick<ChapterViewProps, 'prevHref' | 'nextHref' | 'labels'> & { position: string }) {
  return (
    <nav className="chapter-nav" aria-label={`${labels.chapters} — ${position}`}>
      {prevHref ? <a href={prevHref} className="btn" rel="prev">← {labels.prevChapter}</a> : <span />}
      {nextHref ? <a href={nextHref} className="btn" rel="next">{labels.nextChapter} →</a> : <span />}
    </nav>
  )
}

/** Un capitol: pergament, versete numerotate (numărul nu intră la copiere), navigare. Prezentare pură. */
export default function ChapterView(p: ChapterViewProps) {
  const text = (
    <div className="reader-text" lang="ro">
      {p.verses.map(v => (
        <span key={v.n} className="verse" id={`v${v.n}`} data-verse={v.n}>
          <sup className="vnum" data-n={v.n} />
          {v.text}
        </span>
      ))}
    </div>
  )
  return (
    <>
      <PageHead sec="evanghelie" crumbs={p.crumbs} eyebrow={p.bookTitle} title={`${p.labels.chapter} ${p.chapter}`} size="m">
        <details className="chapter-picker">
          <summary className="btn sm">{p.labels.chooseChapter}</summary>
          <ChapterGrid count={p.count} hrefFor={p.hrefFor} current={p.chapter} label={p.labels.chapters} />
        </details>
      </PageHead>

      <ChapterNav prevHref={p.prevHref} nextHref={p.nextHref} labels={p.labels} position="sus" />

      <article className="card reader-card" data-sec="evanghelie" aria-label={`${p.bookTitle}, ${p.labels.chapter.toLowerCase()} ${p.chapter}`}>
        {p.reportSlug && <ReportNote />}
        <ReaderControls label={p.labels.textSize} sizeLabels={p.labels.sizes}>
          {p.reportSlug ? <VerseReportLayer slug={p.reportSlug} chapter={p.chapter}>{text}</VerseReportLayer> : text}
        </ReaderControls>
        <footer className="reader-foot">
          <p>{p.sourceNote}</p>
          {p.langNote && <p>{p.langNote}</p>}
        </footer>
      </article>

      <ChapterNav prevHref={p.prevHref} nextHref={p.nextHref} labels={p.labels} position="jos" />
    </>
  )
}
