import PageHead from '@/components/shell/PageHead'
import ChapterGrid from './ChapterGrid'

export interface BookViewProps {
  title: string
  /** „Cartea 43 din 80 · Noul Testament". */
  meta: string
  crumbs: { href?: string; label: string }[]
  /** Capitole în baza de date; 0 = textul nu e încă disponibil. */
  count: number
  hrefFor: (n: number) => string
  labels: { chapters: string; readFromStart: string; comingSoon: string; backToList: string; backHref: string }
}

/** Pagina unei cărți: grila capitolelor sau mesajul „în curând". Prezentare pură. */
export default function BookView({ title, meta, crumbs, count, hrefFor, labels }: BookViewProps) {
  return (
    <>
      <PageHead sec="evanghelie" crumbs={crumbs} eyebrow={meta} title={title} size="m" />
      <section className="card" data-sec="evanghelie" aria-labelledby="carte-capitole">
        {count > 0 ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <h2 id="carte-capitole" className="eyebrow">{labels.chapters} · {count}</h2>
              <a href={hrefFor(1)} className="btn">{labels.readFromStart} →</a>
            </div>
            <ChapterGrid count={count} hrefFor={hrefFor} label={labels.chapters} />
          </>
        ) : (
          <div className="flex flex-col items-start gap-4">
            <h2 id="carte-capitole" className="sr-only">{labels.chapters}</h2>
            <p className="rubric">{labels.comingSoon}</p>
            <a href={labels.backHref} className="btn">← {labels.backToList}</a>
          </div>
        )}
      </section>
    </>
  )
}
