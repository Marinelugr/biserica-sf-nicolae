interface Props {
  count: number
  hrefFor: (n: number) => string
  current?: number
  label: string
}

/** Grila capitolelor 1..N: butoane mari (≥ 44 px), fără JavaScript. */
export default function ChapterGrid({ count, hrefFor, current, label }: Props) {
  return (
    <ol className="chapter-grid" aria-label={label}>
      {Array.from({ length: count }, (_, i) => i + 1).map(n => (
        <li key={n}>
          <a href={hrefFor(n)} className="chapter-cell" aria-current={n === current ? 'page' : undefined}>{n}</a>
        </li>
      ))}
    </ol>
  )
}
